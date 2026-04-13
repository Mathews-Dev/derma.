import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { DecimalPipe, DatePipe } from '@angular/common';
import { InsumosService, MovimientosInsumoService } from '@derma/firebase';
import { AuthService } from '@derma/firebase';
import {
  CATEGORIA_INSUMO_LABELS,
  MOTIVO_ENTRADA_LABELS,
  MOTIVO_SALIDA_LABELS,
  Insumo,
  MotivoEntrada,
  MotivoSalida,
  MovimientoInsumo,
  RolUsuario,
  getEstadoStock,
} from '@derma/models';
import { UiPageHeaderComponent, UiDropdownSelectComponent, DatepickerComponent, SelectOption, ToastService } from '@derma/ui';
import { MovimientoItemComponent } from '../../ui/movimiento-item/movimiento-item.component';
import { StockIndicatorComponent } from '../../ui/stock-indicator/stock-indicator.component';
import { Timestamp } from 'firebase/firestore';

type TipoMovimiento = 'entrada' | 'salida' | 'ajuste';

@Component({
  selector: 'app-insumo-detail',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, FormsModule, UiDropdownSelectComponent, DatepickerComponent, MovimientoItemComponent, StockIndicatorComponent, DecimalPipe, DatePipe],
  templateUrl: './insumo-detail.component.html',
})
export class InsumoDetailComponent {
  private readonly insumosService    = inject(InsumosService);
  private readonly movimientosService = inject(MovimientosInsumoService);
  private readonly authService       = inject(AuthService);
  private readonly toastService      = inject(ToastService);
  private readonly router            = inject(Router);
  private readonly route             = inject(ActivatedRoute);

  readonly MOTIVO_SALIDA_LABELS  = MOTIVO_SALIDA_LABELS;
  readonly MOTIVO_ENTRADA_LABELS = MOTIVO_ENTRADA_LABELS;
  readonly MOTIVOS_SALIDA  = Object.keys(MOTIVO_SALIDA_LABELS)  as MotivoSalida[];
  readonly MOTIVOS_ENTRADA = Object.keys(MOTIVO_ENTRADA_LABELS) as MotivoEntrada[];

  readonly insumoId = signal<string>(this.route.snapshot.paramMap.get('id') ?? '');
  readonly insumo   = signal<Insumo | null>(null);

  private readonly _movimientos = toSignal(
    this.movimientosService.getByInsumo(this.insumoId()),
    { initialValue: [] as MovimientoInsumo[] },
  );

  readonly movimientos = computed(() =>
    [...this._movimientos()].sort((a, b) => b.fecha.toMillis() - a.fecha.toMillis())
  );

  readonly canEdit = computed(() => {
    const rol = this.authService.currentUser()?.rol;
    return rol === RolUsuario.ADMIN || rol === RolUsuario.DERMATOLOGO || rol === RolUsuario.RECEPCIONISTA;
  });

  readonly canAdmin = computed(() => this.authService.currentUser()?.rol === RolUsuario.ADMIN);

  readonly today = new Date();

  readonly categoriaLabel = computed(() =>
    this.insumo() ? CATEGORIA_INSUMO_LABELS[this.insumo()!.categoria] : ''
  );

  // Modal movimiento
  readonly showMovModal         = signal(false);
  readonly isMovClosing         = signal(false);
  readonly tipoMov              = signal<TipoMovimiento>('salida');
  readonly cantidadMov          = signal(1);
  readonly motivoSalida         = signal<MotivoSalida>('uso_tratamiento');
  readonly motivoEntrada        = signal<MotivoEntrada>('compra');
  readonly loteEntrada          = signal('');
  readonly fechaVencLote        = signal<Date | null>(null);
  readonly notasMov             = signal('');

  readonly motivoSalidaOptions: SelectOption[]  = Object.entries(MOTIVO_SALIDA_LABELS).map(([id, label]) => ({ id, label }));
  readonly motivoEntradaOptions: SelectOption[] = Object.entries(MOTIVO_ENTRADA_LABELS).map(([id, label]) => ({ id, label }));
  readonly savingMov     = signal(false);

  readonly stockResultante = computed(() => {
    const insumo = this.insumo();
    if (!insumo) return 0;
    const tipo = this.tipoMov();
    const cant = this.cantidadMov();
    if (tipo === 'entrada') return insumo.stockActual + cant;
    if (tipo === 'salida')  return Math.max(0, insumo.stockActual - cant);
    // ajuste: la cantidad es el nuevo stock absoluto
    return cant;
  });

  // Desactivar confirm
  readonly showDesactivarConfirm  = signal(false);
  readonly isDesactivarClosing    = signal(false);
  readonly desactivando           = signal(false);

  constructor() {
    if (!this.insumoId()) {
      this.router.navigate(['/admin/insumos']);
      return;
    }
    this.insumosService.getById(this.insumoId()).then(insumo => {
      if (!insumo) { this.router.navigate(['/admin/insumos']); return; }
      this.insumo.set(insumo);
    });
  }

  abrirMovModal(tipo: TipoMovimiento = 'salida'): void {
    this.tipoMov.set(tipo);
    this.cantidadMov.set(1);
    this.notasMov.set('');
    this.loteEntrada.set('');
    this.fechaVencLote.set(null);
    this.isMovClosing.set(false);
    this.showMovModal.set(true);
  }

  cerrarMovModal(): void {
    this.isMovClosing.set(true);
    setTimeout(() => {
      this.isMovClosing.set(false);
      this.showMovModal.set(false);
    }, 350);
  }

  cerrarDesactivarModal(): void {
    this.isDesactivarClosing.set(true);
    setTimeout(() => {
      this.isDesactivarClosing.set(false);
      this.showDesactivarConfirm.set(false);
    }, 350);
  }

  onMotivoSalidaChange(opt: SelectOption): void  { this.motivoSalida.set(opt.id as MotivoSalida);   }
  onMotivoEntradaChange(opt: SelectOption): void { this.motivoEntrada.set(opt.id as MotivoEntrada); }

  async registrarMovimiento(): Promise<void> {
    const insumo = this.insumo();
    if (!insumo) return;

    this.savingMov.set(true);
    try {
      const user      = this.authService.currentUser();
      const stockAnterior  = insumo.stockActual;
      const stockNuevo     = this.stockResultante();
      const tipo           = this.tipoMov();

      const fechaVencLoteDate = this.fechaVencLote()
        ? Timestamp.fromDate(this.fechaVencLote()!)
        : undefined;

      const movData: Parameters<typeof this.insumosService.registrarMovimiento>[2] = {
        insumoId:           insumo.id,
        insumoNombre:       insumo.nombre,
        tipo,
        cantidad:           this.cantidadMov(),
        stockAnterior,
        realizadoPor:       user?.uid ?? '',
        realizadoPorNombre: `${user?.nombre ?? ''} ${user?.apellido ?? ''}`.trim(),
        fecha:              Timestamp.now(),
      };

      if (tipo === 'salida')  movData.motivoSalida  = this.motivoSalida();
      if (tipo === 'entrada') movData.motivoEntrada = this.motivoEntrada();
      if (this.loteEntrada().trim())  movData.lote = this.loteEntrada().trim();
      if (fechaVencLoteDate)          movData.fechaVencimientoLote = fechaVencLoteDate;
      if (this.notasMov().trim())     movData.notas = this.notasMov().trim();

      await this.insumosService.registrarMovimiento(
        insumo.id,
        stockNuevo,
        movData,
        // Si es entrada y hay datos de lote, actualizar el insumo con el nuevo lote
        tipo === 'entrada' && this.loteEntrada().trim() ? {
          loteActual:       this.loteEntrada().trim(),
          fechaVencimiento: fechaVencLoteDate,
          // Resetear flags si el stock sube por encima del mínimo
          notifBajoEnviada: stockNuevo > insumo.stockMinimo ? false : insumo.notifBajoEnviada,
        } : undefined,
      );

      // Actualizar el insumo local para reflejar el nuevo stock
      this.insumo.set({ ...insumo, stockActual: stockNuevo });
      this.showMovModal.set(false);
      this.toastService.success('Movimiento registrado.');
    } catch (error) {
      console.error(error);
      this.toastService.error('Error al registrar el movimiento.');
    } finally {
      this.savingMov.set(false);
    }
  }

  async desactivar(): Promise<void> {
    const insumo = this.insumo();
    if (!insumo) return;
    this.desactivando.set(true);
    try {
      await this.insumosService.desactivar(insumo.id);
      this.toastService.success('Insumo desactivado.');
      await this.router.navigate(['/admin/insumos']);
    } catch {
      this.toastService.error('Error al desactivar el insumo.');
      this.desactivando.set(false);
    }
  }
}

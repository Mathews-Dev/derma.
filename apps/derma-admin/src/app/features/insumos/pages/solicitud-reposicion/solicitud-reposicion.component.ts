import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { InsumosService, TareasService } from '@derma/firebase';
import { AuthService } from '@derma/firebase';
import { NotificacionAdminService } from '@derma/firebase';
import {
  Insumo,
  PrioridadTarea,
  RolUsuario,
  Usuario,
} from '@derma/models';
import { UiInputComponent, UiStickyFooterComponent, ToastService, UiDropdownSelectComponent, SelectOption } from '@derma/ui';
import { Firestore, collection, getDocs, query, where } from '@angular/fire/firestore';
import { Timestamp } from 'firebase/firestore';
import { LayoutStateService } from '../../../../core/services/layout-state.service';

@Component({
  selector: 'app-solicitud-reposicion',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, UiInputComponent, UiStickyFooterComponent, UiDropdownSelectComponent],
  templateUrl: './solicitud-reposicion.component.html',
})
export class SolicitudReposicionComponent {
  private readonly insumosService = inject(InsumosService);
  private readonly tareasService  = inject(TareasService);
  private readonly notifService   = inject(NotificacionAdminService);
  private readonly authService    = inject(AuthService);
  private readonly toastService   = inject(ToastService);
  private readonly router         = inject(Router);
  private readonly route          = inject(ActivatedRoute);
  private readonly firestore      = inject(Firestore);
  private readonly fb             = inject(FormBuilder);
  private readonly layoutState    = inject(LayoutStateService);

  readonly insumoId           = signal<string>(this.route.snapshot.paramMap.get('id') ?? '');
  readonly insumo             = signal<Insumo | null>(null);
  readonly saving             = signal(false);
  readonly prioridad          = signal<PrioridadTarea>(PrioridadTarea.MEDIA);
  readonly isSidebarCollapsed = this.layoutState.isSidebarCollapsed;

  readonly admins           = signal<Usuario[]>([]);
  readonly selectedAdminUid = signal<string>('todos');
  readonly adminOptions     = computed<SelectOption[]>(() => [
    { id: 'todos', label: 'Todos los administradores' },
    ...this.admins().map(a => ({ id: a.uid, label: `${a.nombre} ${a.apellido}`.trim() })),
  ]);

  readonly form = this.fb.group({
    cantidad: [1, [Validators.required, Validators.min(1)]],
    nota:     [''],
  });

  readonly PRIORIDADES: { value: PrioridadTarea; label: string }[] = [
    { value: PrioridadTarea.BAJA,    label: 'Baja'    },
    { value: PrioridadTarea.MEDIA,   label: 'Media'   },
    { value: PrioridadTarea.ALTA,    label: 'Alta'    },
    { value: PrioridadTarea.URGENTE, label: 'Urgente' },
  ];

  constructor() {
    if (!this.insumoId()) {
      this.router.navigate(['/admin/insumos']);
      return;
    }
    this.insumosService.getById(this.insumoId()).then(insumo => {
      if (!insumo) { this.router.navigate(['/admin/insumos']); return; }
      this.insumo.set(insumo);
    });
    this._loadAdmins();
  }

  volver(): void {
    this.router.navigate(['/admin/insumos', this.insumoId()]);
  }

  async enviar(): Promise<void> {
    if (this.form.invalid) return;
    const insumo = this.insumo();
    const user   = this.authService.currentUser();
    if (!insumo || !user) return;

    const cantidad = this.form.get('cantidad')?.value ?? 1;
    const nota     = (this.form.get('nota')?.value ?? '').trim();

    this.saving.set(true);
    try {
      const sel       = this.selectedAdminUid();
      const admins    = sel === 'todos' ? this.admins().map(a => a.uid) : [sel];
      const prioridad = this.prioridad();
      const nombreAutor = `${user.nombre} ${user.apellido}`.trim();

      const descripcion = [
        `Solicitud de reposición de ${insumo.nombre}.`,
        `Cantidad sugerida: ${cantidad} ${insumo.unidadMedida}.`,
        `Stock actual: ${insumo.stockActual} / Mínimo: ${insumo.stockMinimo}.`,
        insumo.proveedor ? `Proveedor: ${insumo.proveedor.nombre}${insumo.proveedor.telefono ? ' · ' + insumo.proveedor.telefono : ''}.` : '',
        nota ? `Nota: ${nota}` : '',
      ].filter(Boolean).join('\n');

      const tareaId = await this.tareasService.crear(
        {
          titulo:           `Compra de ${insumo.nombre}`,
          descripcion,
          estado:           'pendiente' as never,
          progreso:         0,
          prioridad,
          categoria:        'compras',
          esUrgente:        prioridad === PrioridadTarea.URGENTE,
          creadaPor:        user.uid,
          asignadaA:        admins,
          asignadaANombres: [],
          comentarios:      [],
          etiquetas:        ['insumos', insumo.categoria],
          archivada:        false,
          fechaCreacion:    Timestamp.now(),
        } as never,
        user.uid,
        nombreAutor,
      );

      if (admins.length) {
        const notifs = admins.map(uid =>
          this.notifService.buildNotif(
            'inventario_solicitud_reposicion',
            uid,
            'Solicitud de reposición',
            `${nombreAutor} solicitó reposición de ${insumo.nombre}.`,
            {
              remitenteUid:    user.uid,
              remitenteNombre: nombreAutor,
              accionUrl:       `/admin/tareas`,
              accionTexto:     'Ver tarea',
              relacionadoId:   tareaId,
              relacionadoTipo: 'tarea',
              prioridad,
            },
          )
        );
        await this.notifService.crearBatch(notifs);
      }

      this.toastService.success('Solicitud enviada. Se creó una tarea de compra para los administradores.');
      await this.router.navigate(['/admin/insumos', insumo.id]);
    } catch {
      this.toastService.error('Error al enviar la solicitud.');
    } finally {
      this.saving.set(false);
    }
  }

  private async _loadAdmins(): Promise<void> {
    const col  = collection(this.firestore, 'usuarios');
    const q    = query(col, where('rol', '==', RolUsuario.ADMIN));
    const snap = await getDocs(q);
    this.admins.set(snap.docs.map(d => ({ uid: d.id, ...d.data() }) as Usuario));
  }
}
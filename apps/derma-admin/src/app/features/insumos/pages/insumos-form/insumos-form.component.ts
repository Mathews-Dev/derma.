import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { InsumosService, AuthService } from '@derma/firebase';
import {
  CATEGORIA_INSUMO_LABELS,
  UNIDAD_MEDIDA_LABELS,
  CategoriaInsumo,
  Insumo,
  InsumoInput,
  UnidadMedida,
} from '@derma/models';
import {
  UiInputComponent,
  UiLoaderCardComponent,
  UiDropdownSelectComponent,
  SelectOption,
  UiStickyFooterComponent,
  UiVerticalTabsComponent,
  VerticalTabItem,
  DatepickerComponent,
  ToastService,
} from '@derma/ui';
import { CloudinaryService } from '../../../../core/services/cloudinary.service';
import { LayoutStateService } from '../../../../core/services/layout-state.service';
import { Timestamp } from 'firebase/firestore';

@Component({
  selector: 'app-insumos-form',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterModule,
    ReactiveFormsModule,
    UiInputComponent,
    UiLoaderCardComponent,
    UiDropdownSelectComponent,
    UiStickyFooterComponent,
    UiVerticalTabsComponent,
    DatepickerComponent,
  ],
  providers: [CloudinaryService],
  templateUrl: './insumos-form.component.html',
})
export class InsumosFormComponent {
  private readonly insumosService  = inject(InsumosService);
  private readonly authService     = inject(AuthService);
  private readonly toastService    = inject(ToastService);
  private readonly cloudinary      = inject(CloudinaryService);
  private readonly router          = inject(Router);
  private readonly route           = inject(ActivatedRoute);
  private readonly fb              = inject(FormBuilder);
  private readonly layoutState     = inject(LayoutStateService);

  readonly isSidebarCollapsed = this.layoutState.isSidebarCollapsed;

  readonly insumoId   = signal<string | null>(this.route.snapshot.paramMap.get('id'));
  readonly isEdit     = computed(() => !!this.insumoId());
  readonly saving     = signal(false);
  readonly isLoading  = signal(false);
  readonly loadingFoto = signal(false);

  // Photo signals (outside FormGroup)
  readonly fotoUrl         = signal<string | null>(null);
  readonly fotoPublicId    = signal<string | null>(null);
  readonly pendingFotoFile = signal<File | null>(null);
  readonly fotoPreview     = signal<string | null>(null);

  // Dropdown + datepicker signals
  readonly selectedCategoria = signal<CategoriaInsumo>('descartable_medico');
  readonly selectedUnidad    = signal<UnidadMedida>('unidades');
  readonly selectedFechaVenc = signal<Date | null>(null);

  // Tabs
  readonly activeTab = signal<string>('general');
  readonly tabs: VerticalTabItem[] = [
    { id: 'general',   label: 'General',   icon: 'tag' },
    { id: 'stock',     label: 'Stock',     icon: 'list' },
    { id: 'proveedor', label: 'Proveedor', icon: 'users' },
  ];

  readonly CATEGORIAS       = Object.keys(CATEGORIA_INSUMO_LABELS) as CategoriaInsumo[];
  readonly UNIDADES         = Object.keys(UNIDAD_MEDIDA_LABELS) as UnidadMedida[];
  readonly CATEGORIA_LABELS = CATEGORIA_INSUMO_LABELS;
  readonly UNIDAD_LABELS    = UNIDAD_MEDIDA_LABELS;

  readonly categoriaOptions: SelectOption[] = this.CATEGORIAS.map(c => ({
    id: c, label: this.CATEGORIA_LABELS[c],
  }));

  readonly unidadOptions: SelectOption[] = this.UNIDADES.map(u => ({
    id: u, label: this.UNIDAD_LABELS[u],
  }));

  readonly form = this.fb.group({
    nombre:            ['', Validators.required],
    descripcion:       [''],
    codigo:            [''],
    stockActual:       [0, [Validators.required, Validators.min(0)]],
    stockMinimo:       [0, [Validators.required, Validators.min(0)]],
    stockMaximo:       [null as number | null],
    precioUnitario:    [null as number | null],
    ubicacion:         [''],
    loteActual:        [''],
    proveedorNombre:   [''],
    proveedorTel:      [''],
    proveedorEmail:    [''],
    proveedorContacto: [''],
  });

  constructor() {
    const id = this.insumoId();
    if (id) {
      this.isLoading.set(true);
      this.insumosService.getById(id).then(insumo => {
        if (!insumo) { this.router.navigate(['/admin/insumos']); return; }
        this._poblarFormulario(insumo);
        this.isLoading.set(false);
      });
    }
  }

  onFotoChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file  = input.files?.[0];
    if (!file) return;
    const prev = this.fotoPreview();
    if (prev?.startsWith('blob:')) URL.revokeObjectURL(prev);
    this.pendingFotoFile.set(file);
    this.fotoPreview.set(URL.createObjectURL(file));
  }

  onCategoriaChange(opt: SelectOption): void {
    this.selectedCategoria.set(opt.id as CategoriaInsumo);
  }

  onUnidadChange(opt: SelectOption): void {
    this.selectedUnidad.set(opt.id as UnidadMedida);
  }

  onFechaVencChange(date: Date): void {
    this.selectedFechaVenc.set(date);
  }

  volver(): void {
    this.router.navigate(['/admin/insumos']);
  }

  async guardar(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toastService.error('Completá los campos obligatorios.');
      return;
    }

    this.saving.set(true);
    try {
      const pendingFile = this.pendingFotoFile();
      if (pendingFile) {
        this.loadingFoto.set(true);
        try {
          const result = await this.cloudinary.upload(pendingFile);
          this.fotoUrl.set(result.secureUrl);
          this.fotoPublicId.set(result.publicId);
          this.pendingFotoFile.set(null);
          const preview = this.fotoPreview();
          if (preview?.startsWith('blob:')) URL.revokeObjectURL(preview);
          this.fotoPreview.set(null);
        } catch {
          this.toastService.error('Error al subir la imagen.');
          return;
        } finally {
          this.loadingFoto.set(false);
        }
      }

      const v = this.form.getRawValue();

      const proveedor = v.proveedorNombre?.trim() ? {
        nombre:   v.proveedorNombre.trim(),
        telefono: v.proveedorTel?.trim()      || undefined,
        email:    v.proveedorEmail?.trim()    || undefined,
        contacto: v.proveedorContacto?.trim() || undefined,
      } : undefined;

      const fechaVencDate = this.selectedFechaVenc();
      const fechaVenc = fechaVencDate ? Timestamp.fromDate(fechaVencDate) : undefined;

      const data: InsumoInput = {
        nombre:           v.nombre!.trim(),
        descripcion:      v.descripcion?.trim()      || undefined,
        codigo:           v.codigo?.trim()            || undefined,
        categoria:        this.selectedCategoria(),
        unidadMedida:     this.selectedUnidad(),
        stockActual:      Number(v.stockActual)       ?? 0,
        stockMinimo:      Number(v.stockMinimo)       ?? 0,
        stockMaximo:      v.stockMaximo != null ? Number(v.stockMaximo)    : undefined,
        precioUnitario:   v.precioUnitario != null ? Number(v.precioUnitario) : undefined,
        ubicacion:        v.ubicacion?.trim()         || undefined,
        loteActual:       v.loteActual?.trim()        || undefined,
        fechaVencimiento: fechaVenc,
        proveedor,
        fotoUrl:          this.fotoUrl()              ?? undefined,
        fotoPublicId:     this.fotoPublicId()         ?? undefined,
        activo:           true,
        creadoPor:        this.authService.currentUser()?.uid ?? '',
      };

      const id = this.insumoId();
      if (id) {
        await this.insumosService.actualizar(id, data);
        this.toastService.success('Insumo actualizado.');
        await this.router.navigate(['/admin/insumos', id]);
      } else {
        const newId = await this.insumosService.crear(data);
        this.toastService.success('Insumo creado.');
        await this.router.navigate(['/admin/insumos', newId]);
      }
    } catch {
      this.toastService.error('Error al guardar el insumo.');
    } finally {
      this.saving.set(false);
    }
  }

  private _poblarFormulario(insumo: Insumo): void {
    this.form.patchValue({
      nombre:            insumo.nombre,
      descripcion:       insumo.descripcion      ?? '',
      codigo:            insumo.codigo           ?? '',
      stockActual:       insumo.stockActual,
      stockMinimo:       insumo.stockMinimo,
      stockMaximo:       insumo.stockMaximo      ?? null,
      precioUnitario:    insumo.precioUnitario   ?? null,
      ubicacion:         insumo.ubicacion        ?? '',
      loteActual:        insumo.loteActual       ?? '',
      proveedorNombre:   insumo.proveedor?.nombre   ?? '',
      proveedorTel:      insumo.proveedor?.telefono ?? '',
      proveedorEmail:    insumo.proveedor?.email    ?? '',
      proveedorContacto: insumo.proveedor?.contacto ?? '',
    });
    this.selectedCategoria.set(insumo.categoria);
    this.selectedUnidad.set(insumo.unidadMedida);
    this.fotoUrl.set(insumo.fotoUrl       ?? null);
    this.fotoPublicId.set(insumo.fotoPublicId ?? null);
    if (insumo.fechaVencimiento) {
      this.selectedFechaVenc.set(insumo.fechaVencimiento.toDate());
    }
    this.form.markAsPristine();
  }
}
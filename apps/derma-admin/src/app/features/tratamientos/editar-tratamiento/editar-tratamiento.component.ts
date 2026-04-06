import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { DecimalPipe } from '@angular/common';
import {
  FormArray,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { TratamientosService } from '@derma/firebase';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  CategoriaTratamiento,
  EstadoTratamiento,
  FaqItem,
  GaleriaItem,
  Profesional,
  RedesSociales,
  Tratamiento,
} from '@derma/models';
import {
  SelectOption,
  ToastService,
  UiDropdownSelectComponent,
  UiInputComponent,
  UiLoaderCardComponent,
  UiStickyFooterComponent,
  UiVerticalTabsComponent,
  VerticalTabItem,
  CheckboxComponent,
} from '@derma/ui';
import { Subject, takeUntil } from 'rxjs';
import { CloudinaryService } from '../../../core/services/cloudinary.service';
import { LayoutStateService } from '../../../core/services/layout-state.service';

type ActiveTab = 'info' | 'descripcion' | 'precios' | 'protocolo' | 'profesionales' | 'galeria' | 'seo';

@Component({
  selector: 'derm-editar-tratamiento',
  standalone: true,
  imports: [
    DecimalPipe,
    ReactiveFormsModule,
    RouterModule,
    UiInputComponent,
    UiLoaderCardComponent,
    UiDropdownSelectComponent,
    UiStickyFooterComponent,
    UiVerticalTabsComponent,
    CheckboxComponent,
  ],
  providers: [CloudinaryService],
  templateUrl: './editar-tratamiento.component.html',
  styleUrl: './editar-tratamiento.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditarTratamientoComponent {
  private readonly tratamientosService = inject(TratamientosService);
  private readonly toastService        = inject(ToastService);
  private readonly cloudinary          = inject(CloudinaryService);
  private readonly router              = inject(Router);
  private readonly route               = inject(ActivatedRoute);
  private readonly fb                  = inject(FormBuilder);
  private readonly layoutState         = inject(LayoutStateService);
  private readonly destroy$            = new Subject<void>();

  readonly isSidebarCollapsed = this.layoutState.isSidebarCollapsed;
  readonly EstadoTratamiento = EstadoTratamiento;

  // ── Route params ─────────────────────────────────────────────────────────────
  private readonly routeParams = toSignal(this.route.paramMap);
  readonly tratamientoId       = computed(() => this.routeParams()?.get('id') ?? null);
  readonly isNewMode           = computed(() => this.tratamientoId() === null);

  // ── UI state ─────────────────────────────────────────────────────────────────
  activeTab    = signal<ActiveTab>('info');
  isLoading    = signal(true);
  isSubmitting = signal(false);

  readonly tabs: VerticalTabItem[] = [
    { id: 'info',          label: 'Información general', icon: 'tag'       },
    { id: 'descripcion',   label: 'Descripción',         icon: 'list'      },
    { id: 'precios',       label: 'Precios',             icon: 'briefcase' },
    { id: 'protocolo',     label: 'Protocolo',           icon: 'file'      },
    { id: 'profesionales', label: 'Dermatólogos',        icon: 'users'     },
    { id: 'galeria',       label: 'Galería',             icon: 'image'     },
    { id: 'seo',           label: 'SEO y Redes',         icon: 'globe'     },
  ];

  // ── Selects ────────────────────────────────────────────────────────────────
  readonly categoriaOptions: SelectOption[] = [
    { id: 'facial',     label: 'Facial'     },
    { id: 'corporal',   label: 'Corporal'   },
    { id: 'piel',       label: 'Piel'       },
    { id: 'capilar',    label: 'Capilar'    },
    { id: 'bienestar',  label: 'Bienestar'  },
    { id: 'quirurgico', label: 'Quirúrgico' },
    { id: 'otro',       label: 'Otro'       },
  ];

  readonly estadoOptions: SelectOption[] = [
    { id: EstadoTratamiento.BORRADOR,  label: 'Borrador (no visible)'  },
    { id: EstadoTratamiento.ACTIVO,    label: 'Activo (publicado)'      },
    { id: EstadoTratamiento.ARCHIVADO, label: 'Archivado'               },
  ];

  readonly duracionOptions: SelectOption[] = [
    { id: 15,  label: '15 minutos' },
    { id: 30,  label: '30 minutos' },
    { id: 45,  label: '45 minutos' },
    { id: 60,  label: '60 minutos' },
    { id: 90,  label: '90 minutos' },
    { id: 120, label: '2 horas'    },
  ];

  // ── Signal state ──────────────────────────────────────────────────────────
  selectedCategoria = signal<CategoriaTratamiento>('facial');
  selectedEstado    = signal<EstadoTratamiento>(EstadoTratamiento.BORRADOR);
  selectedDuracion  = signal<number>(60);

  /** IDs de profesionales seleccionados */
  profesionalesSeleccionados = signal<string[]>([]);
  allProfesionales           = signal<Profesional[]>([]);

  /** Galería con items tipados */
  galeria                = signal<GaleriaItem[]>([]);
  imagenPrincipalUrl     = signal<string>('');
  viewingGaleriaImage    = signal<string | null>(null);

  /** Videos de redes sociales (múltiples por plataforma) */
  redesVideos = signal<{ tipo: 'youtube' | 'instagram' | 'tiktok'; url: string }[]>([]);
  nuevoVideoUrl = signal<string>('');

  /** Etiquetas como array editable */
  etiquetas = signal<string[]>([]);
  nuevoEtiqueta = signal<string>('');

  // Files pendientes de subir (galería) — se suben en onSubmit()
  private readonly pendingGaleriaFiles = new Map<number, File>(); // index → File
  private pendingImagenPrincipal: File | null = null;

  // ── Form ──────────────────────────────────────────────────────────────────
  readonly form: FormGroup = this.fb.group({
    // info
    nombre:   ['', Validators.required],
    orden:    [0],
    destacado:[false],
    // descripcion
    descripcionCorta: ['', Validators.required],
    descripcion:      [''],
    resultadosEsperados: [''],
    tiempoRecuperacion:  [''],
    duracion:            [60],
    duracionDisplay:     [''],
    sesionesRecomendadas:[1],
    sesionesDisplay:     [''],
    // precios
    precio:      [0, [Validators.required, Validators.min(0)]],
    precioDesde: [null as number | null],
    // protocolo — listas manejadas con signals/arrays
    // profesionales — manejado con signal
    // seo
    metaDescripcion: [''],
  });

  // Listas manejadas como arrays simples en signals
  beneficios        = signal<string[]>(['']);
  contraindicaciones = signal<string[]>(['']);
  instruccionesPre  = signal<string[]>(['']);
  instruccionesPost = signal<string[]>(['']);
  faqs              = signal<FaqItem[]>([]);

  constructor() {
    effect(() => {
      const id = this.tratamientoId();
      if (id) {
        this.loadTratamiento(id);
      } else {
        this.isLoading.set(false);
      }
    });

    // Cargar dermatólogos para el selector
    this.tratamientosService.getProfesionalesDermatologos()
      .pipe(takeUntil(this.destroy$))
      .subscribe(p => this.allProfesionales.set(p));
  }

  // ── Load ──────────────────────────────────────────────────────────────────
  private async loadTratamiento(id: string): Promise<void> {
    this.isLoading.set(true);
    try {
      const data = await this.tratamientosService.getById(id);
      if (!data) {
        this.toastService.show('Tratamiento no encontrado', 'error');
        this.volver();
        return;
      }

      this.selectedCategoria.set(data.categoria);
      this.selectedEstado.set(data.estado);
      this.selectedDuracion.set(data.duracion);
      this.profesionalesSeleccionados.set(data.profesionalesSugeridos ?? []);
      this.galeria.set(data.galeria ?? []);
      this.imagenPrincipalUrl.set(data.imagenPrincipal ?? '');
      this.etiquetas.set(data.etiquetas ?? []);
      this.beneficios.set(data.beneficios?.length ? data.beneficios : ['']);
      this.contraindicaciones.set(data.contraindicaciones?.length ? data.contraindicaciones : ['']);
      this.instruccionesPre.set(data.instruccionesPre?.length ? data.instruccionesPre : ['']);
      this.instruccionesPost.set(data.instruccionesPost?.length ? data.instruccionesPost : ['']);
      this.faqs.set(data.faqs ?? []);

      // Cargar videos de redes sociales como array
      const videos: { tipo: 'youtube' | 'instagram' | 'tiktok'; url: string }[] = [];
      if (data.redesSociales?.youtube)   videos.push({ tipo: 'youtube',   url: data.redesSociales.youtube   });
      if (data.redesSociales?.instagram) videos.push({ tipo: 'instagram', url: data.redesSociales.instagram });
      if (data.redesSociales?.tiktok)    videos.push({ tipo: 'tiktok',    url: data.redesSociales.tiktok    });
      this.redesVideos.set(videos);

      this.form.patchValue({
        nombre:              data.nombre,
        orden:               data.orden           ?? 0,
        destacado:           data.destacado       ?? false,
        descripcionCorta:    data.descripcionCorta,
        descripcion:         data.descripcion,
        resultadosEsperados: data.resultadosEsperados,
        tiempoRecuperacion:  data.tiempoRecuperacion,
        duracion:            data.duracion,
        duracionDisplay:     data.duracionDisplay  ?? '',
        sesionesRecomendadas:data.sesionesRecomendadas,
        sesionesDisplay:     data.sesionesDisplay  ?? '',
        precio:              data.precio,
        precioDesde:         data.precioDesde      ?? null,
        metaDescripcion:     data.metaDescripcion  ?? '',
      });
    } catch {
      this.toastService.show('Error al cargar el tratamiento', 'error');
    } finally {
      this.isLoading.set(false);
    }
  }

  // ── Save ──────────────────────────────────────────────────────────────────
  async onSubmit(estado?: EstadoTratamiento): Promise<void> {
    if (this.isSubmitting()) return;
    this.isSubmitting.set(true);

    try {
      // Upload imagen principal
      let imagenPrincipalFinal = this.imagenPrincipalUrl();
      if (this.pendingImagenPrincipal) {
        const result = await this.cloudinary.upload(this.pendingImagenPrincipal);
        imagenPrincipalFinal = result.secureUrl;
        this.imagenPrincipalUrl.set(imagenPrincipalFinal);
        this.pendingImagenPrincipal = null;
      }

      // Upload galería pendiente
      const galeriaActual = [...this.galeria()];
      for (const [idx, file] of this.pendingGaleriaFiles) {
        const result = await this.cloudinary.upload(file);
        if (galeriaActual[idx]) {
          galeriaActual[idx] = { url: result.secureUrl, publicId: result.publicId, alt: galeriaActual[idx].alt };
        }
      }
      this.pendingGaleriaFiles.clear();
      this.galeria.set(galeriaActual);

      const v = this.form.getRawValue();
      const redesSociales: RedesSociales = {};
      for (const video of this.redesVideos()) {
        if (video.url) {
          // Keep last URL per platform (same model structure)
          redesSociales[video.tipo] = video.url;
        }
      }

      const payload: Omit<Tratamiento, 'id'> = {
        nombre:              v.nombre,
        categoria:           this.selectedCategoria(),
        etiquetas:           this.etiquetas().filter(Boolean),
        descripcion:         v.descripcion        || '',
        descripcionCorta:    v.descripcionCorta   || '',
        beneficios:          this.beneficios().filter(Boolean),
        duracion:            v.duracion,
        sesionesRecomendadas:v.sesionesRecomendadas,
        precio:              v.precio,
        imagenPrincipal:     imagenPrincipalFinal || '',
        contraindicaciones:  this.contraindicaciones().filter(Boolean),
        instruccionesPre:    this.instruccionesPre().filter(Boolean),
        instruccionesPost:   this.instruccionesPost().filter(Boolean),
        resultadosEsperados: v.resultadosEsperados || '',
        tiempoRecuperacion:  v.tiempoRecuperacion  || '',
        faqs:                this.faqs(),
        estado:              estado ?? this.selectedEstado(),
        destacado:           v.destacado ?? false,
        orden:               v.orden     ?? 0,
        profesionalesSugeridos: this.profesionalesSeleccionados(),
        galeria:             this.galeria(),
        // Opcionales — solo se incluyen si tienen valor
        ...(v.duracionDisplay          ? { duracionDisplay:     v.duracionDisplay         } : {}),
        ...(v.sesionesDisplay          ? { sesionesDisplay:     v.sesionesDisplay         } : {}),
        ...(v.precioDesde != null && v.precioDesde > 0 ? { precioDesde: v.precioDesde } : {}),
        ...(Object.keys(redesSociales).length   ? { redesSociales }                       : {}),
        ...(v.metaDescripcion          ? { metaDescripcion:     v.metaDescripcion         } : {}),
      };

      const id = this.tratamientoId();
      if (id) {
        await this.tratamientosService.update(id, payload);
        this.toastService.show('Tratamiento actualizado correctamente', 'success');
      } else {
        await this.tratamientosService.create(payload);
        this.toastService.show('Tratamiento creado correctamente', 'success');
        this.volver();
      }
    } catch (error) {
      console.log(error);
      
      this.toastService.show('Error al guardar el tratamiento', 'error');
    } finally {
      this.isSubmitting.set(false);
    }
  }

  guardarComoBorrador(): void {
    this.onSubmit(EstadoTratamiento.BORRADOR);
  }

  volver(): void {
    this.router.navigate(['/admin/tratamientos']);
  }

  // ── Imagen principal ──────────────────────────────────────────────────────
  onImagenPrincipalSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.pendingImagenPrincipal = file;
    this.imagenPrincipalUrl.set(URL.createObjectURL(file));
  }

  // ── Galería ───────────────────────────────────────────────────────────────
  onGaleriaFilesSelected(event: Event): void {
    const files = (event.target as HTMLInputElement).files;
    if (!files) return;
    const currentGaleria = [...this.galeria()];
    Array.from(files).forEach(file => {
      const idx = currentGaleria.length;
      currentGaleria.push({ url: URL.createObjectURL(file), publicId: '', alt: '' });
      this.pendingGaleriaFiles.set(idx, file);
    });
    this.galeria.set(currentGaleria);
    (event.target as HTMLInputElement).value = '';
  }

  removeGaleriaItem(idx: number): void {
    const g = [...this.galeria()];
    const blobUrl = g[idx]?.url;
    if (blobUrl?.startsWith('blob:')) URL.revokeObjectURL(blobUrl);
    g.splice(idx, 1);
    this.galeria.set(g);
    this.pendingGaleriaFiles.delete(idx);
  }

  setImagenPrincipalFromGaleria(url: string): void {
    this.imagenPrincipalUrl.set(url);
  }

  // ── Listas editables (helper genérico) ───────────────────────────────────
  addListItem(sig: ReturnType<typeof signal<string[]>>): void {
    sig.update(arr => [...arr, '']);
  }

  updateListItem(sig: ReturnType<typeof signal<string[]>>, idx: number, value: string): void {
    sig.update(arr => arr.map((v, i) => i === idx ? value : v));
  }

  removeListItem(sig: ReturnType<typeof signal<string[]>>, idx: number): void {
    sig.update(arr => arr.filter((_, i) => i !== idx));
  }

  // ── FAQs ──────────────────────────────────────────────────────────────────
  addFaq(): void {
    this.faqs.update(arr => [...arr, { pregunta: '', respuesta: '' }]);
  }

  updateFaq(idx: number, field: keyof FaqItem, value: string): void {
    this.faqs.update(arr => arr.map((f, i) => i === idx ? { ...f, [field]: value } : f));
  }

  removeFaq(idx: number): void {
    this.faqs.update(arr => arr.filter((_, i) => i !== idx));
  }

  // ── Etiquetas ─────────────────────────────────────────────────────────────
  agregarEtiqueta(): void {
    const val = this.nuevoEtiqueta().trim();
    if (!val) return;
    if (this.etiquetas().includes(val)) return;
    this.etiquetas.update(arr => [...arr, val]);
    this.nuevoEtiqueta.set('');
  }

  quitarEtiqueta(idx: number): void {
    this.etiquetas.update(arr => arr.filter((_, i) => i !== idx));
  }

  // ── Redes sociales — videos ──────────────────────────────────────────────
  addVideo(tipo: 'youtube' | 'instagram' | 'tiktok'): void {
    this.redesVideos.update(arr => [...arr, { tipo, url: '' }]);
  }

  updateVideoUrl(idx: number, url: string): void {
    this.redesVideos.update(arr => arr.map((v, i) => i === idx ? { ...v, url } : v));
  }

  removeVideo(idx: number): void {
    this.redesVideos.update(arr => arr.filter((_, i) => i !== idx));
  }

  // ── Profesionales ─────────────────────────────────────────────────────────
  toggleProfesional(uid: string): void {
    this.profesionalesSeleccionados.update(arr =>
      arr.includes(uid) ? arr.filter(id => id !== uid) : [...arr, uid]
    );
  }

  isProfesionalSelected(uid: string): boolean {
    return this.profesionalesSeleccionados().includes(uid);
  }
}

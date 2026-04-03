import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AuthService, FirestoreService } from '@derma/firebase';
import {
  DocKey,
  DocumentosDetallados,
  EstadoDocumento,
  HonorariosPorTratamiento,
  HorariosLaborales,
  Profesional,
} from '@derma/models';
import {
  UiInputComponent,
  UiLoaderCardComponent,
  ToastService,
  UiDropdownSelectComponent,
  SelectOption,
  ScheduleSelectorComponent,
  UiStickyFooterComponent,
  UiVerticalTabsComponent,
  VerticalTabItem,
  UiProfileAvatarComponent,
  ProfessionalDocsComponent,
  UiButtonComponent,
} from '@derma/ui';
import { CloudinaryService } from '../../../core/services/cloudinary.service';
import { Storage, ref, uploadBytes, getDownloadURL } from '@angular/fire/storage';
import { LayoutStateService } from '../../../core/services/layout-state.service';

interface Country {
  code: string;
  name: string;
  dialCode: string;
}

@Component({
  selector: 'app-perfil-profesional',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterModule,
    UiInputComponent,
    UiLoaderCardComponent,
    UiDropdownSelectComponent,
    ScheduleSelectorComponent,
    UiStickyFooterComponent,
    UiVerticalTabsComponent,
    UiProfileAvatarComponent,
    ProfessionalDocsComponent,
    UiButtonComponent,
  ],
  providers: [CloudinaryService],
  templateUrl: './perfil-profesional.component.html',
  styleUrl: './perfil-profesional.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PerfilProfesionalComponent {
  private readonly firestoreService = inject(FirestoreService);
  private readonly authService = inject(AuthService);
  private readonly toastService = inject(ToastService);
  private readonly storage = inject(Storage);
  private readonly cloudinary = inject(CloudinaryService);
  private readonly fb = inject(FormBuilder);
  private readonly layoutState = inject(LayoutStateService);

  readonly isSidebarCollapsed = this.layoutState.isSidebarCollapsed;

  // ── Country data ────────────────────────────────────────────────────────────
  readonly countries: Country[] = [
    { code: 'AR', name: 'Argentina', dialCode: '+54'  },
    { code: 'ES', name: 'España',    dialCode: '+34'  },
    { code: 'MX', name: 'México',    dialCode: '+52'  },
    { code: 'CL', name: 'Chile',     dialCode: '+56'  },
    { code: 'UY', name: 'Uruguay',   dialCode: '+598' },
    { code: 'CO', name: 'Colombia',  dialCode: '+57'  },
    { code: 'BR', name: 'Brasil',    dialCode: '+55'  },
    { code: 'US', name: 'EE. UU.',   dialCode: '+1'   },
  ];

  readonly countryOptions: SelectOption[] = this.countries.map(c => ({
    id: c.code,
    label: `${c.dialCode} ${c.name}`,
  }));

  readonly duracionOptions: SelectOption[] = [
    { id: 15,  label: '15 minutos'  },
    { id: 20,  label: '20 minutos'  },
    { id: 30,  label: '30 minutos'  },
    { id: 45,  label: '45 minutos'  },
    { id: 60,  label: '60 minutos'  },
    { id: 90,  label: '90 minutos'  },
    { id: 120, label: '2 horas'     },
  ];

  // ── UI state ─────────────────────────────────────────────────────────────────
  activeTab = signal<string>('personal');

  readonly tabs: VerticalTabItem[] = [
    { id: 'personal',    label: 'Información personal', icon: 'user'      },
    { id: 'contacto',    label: 'Contacto',             icon: 'phone'     },
    { id: 'profesional', label: 'Datos profesionales',  icon: 'briefcase' },
    { id: 'horarios',    label: 'Horarios y agenda',    icon: 'calendar'  },
    { id: 'documentos',  label: 'Documentos',           icon: 'file'      },
    { id: 'honorarios',  label: 'Honorarios',           icon: 'tag'       },
    { id: 'seguridad',   label: 'Seguridad',            icon: 'lock'      },
  ];

  isLoading      = signal(true);
  isSubmitting   = signal(false);
  uploadingPhoto = signal(false);

  selectedCountry  = signal<Country>(this.countries[0]);
  selectedDuracion = signal<number>(30);

  horariosLaborales = signal<HorariosLaborales | null>(null);
  documentosDetalle = signal<DocumentosDetallados>({});
  honorarios        = signal<HonorariosPorTratamiento[]>([]);
  viewingDocImage   = signal<string | null>(null);

  // Files pendientes — se suben en onSubmit()
  private readonly pendingDocFiles = new Map<DocKey, File>();

  // ── UID desde auth ────────────────────────────────────────────────────────────
  readonly uid = computed(() => this.authService.currentUser()?.uid ?? '');

  // ── Forms ─────────────────────────────────────────────────────────────────────
  readonly form: FormGroup = this.fb.group({
    nombre:                    ['', Validators.required],
    apellido:                  ['', Validators.required],
    email:                     [{ value: '', disabled: true }],
    dni:                       [''],
    telefono:                  ['', Validators.required],
    fotoPerfil:                [''],
    tituloProfesional:         [''],
    numeroMatriculaNacional:   [''],
    numeroMatriculaProvincial: [''],
    precioConsulta:            [null as number | null],
    duracionConsulta:          [30, Validators.required],
  });

  readonly passwordForm: FormGroup = this.fb.group(
    {
      currentPassword: ['', Validators.required],
      newPassword:     ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required],
    },
    { validators: this.passwordMatchValidator }
  );

  passwordError   = signal<string | null>(null);
  passwordSuccess = signal(false);

  constructor() {
    effect(() => {
      const uid = this.uid();
      if (uid) this.loadProfesional(uid);
    });
  }

  // ── Load ──────────────────────────────────────────────────────────────────────
  private async loadProfesional(uid: string): Promise<void> {
    this.isLoading.set(true);
    try {
      const data = await this.firestoreService.getDocument<Profesional>('usuarios', uid);
      if (!data) return;

      let telefonoRaw = data.telefono ?? '';
      let foundCountry = this.countries[0];
      for (const c of this.countries) {
        if (telefonoRaw.startsWith(c.dialCode)) {
          foundCountry = c;
          telefonoRaw  = telefonoRaw.slice(c.dialCode.length).trimStart();
          break;
        }
      }

      this.selectedCountry.set(foundCountry);
      this.selectedDuracion.set(data.duracionConsulta ?? 30);

      if (data.horariosLaborales) this.horariosLaborales.set(data.horariosLaborales);
      if (data.documentosDetalle) this.documentosDetalle.set(data.documentosDetalle);
      this.honorarios.set(data.honorarios ?? []);

      this.form.patchValue({
        nombre:                    data.nombre,
        apellido:                  data.apellido,
        email:                     data.email,
        dni:                       data.dni ?? '',
        telefono:                  telefonoRaw,
        fotoPerfil:                data.fotoPerfil ?? '',
        tituloProfesional:         data.tituloProfesional ?? '',
        numeroMatriculaNacional:   data.numeroMatriculaNacional ?? '',
        numeroMatriculaProvincial: data.numeroMatriculaProvincial ?? '',
        precioConsulta:            data.precioConsulta ?? null,
        duracionConsulta:          data.duracionConsulta ?? 30,
      });
    } catch {
      this.toastService.error('Error al cargar el perfil');
    } finally {
      this.isLoading.set(false);
    }
  }

  // ── Submit ────────────────────────────────────────────────────────────────────
  async onSubmit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    try {
      const { telefono, ...rest } = this.form.getRawValue();
      const fullPhone = `${this.selectedCountry().dialCode} ${telefono}`.trim();

      for (const [key, file] of this.pendingDocFiles.entries()) {
        const { publicId, secureUrl } = await this.cloudinary.upload(file);
        const current = this.documentosDetalle()[key];
        if (current?.url?.startsWith('blob:')) URL.revokeObjectURL(current.url);
        this.documentosDetalle.update(prev => ({
          ...prev,
          [key]: { ...prev[key], url: secureUrl, publicId },
        }));
      }
      this.pendingDocFiles.clear();

      const payload: Partial<Profesional> = {
        ...rest,
        telefono: fullPhone,
        horariosLaborales: this.horariosLaborales() ?? {},
        honorarios: this.honorarios(),
        documentosDetalle: this.documentosDetalle(),
      };

      await this.firestoreService.updateDocument('usuarios', this.uid(), payload);
      this.toastService.success('Perfil actualizado');
      this.form.markAsPristine();
    } catch {
      this.toastService.error('Error al guardar los cambios');
    } finally {
      this.isSubmitting.set(false);
    }
  }

  // ── Password ──────────────────────────────────────────────────────────────────
  async onChangePassword(): Promise<void> {
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.passwordError.set(null);
    this.passwordSuccess.set(false);

    try {
      const { currentPassword, newPassword } = this.passwordForm.value;
      await this.authService.changePassword(newPassword, currentPassword);
      this.passwordSuccess.set(true);
      this.passwordForm.reset();
    } catch (error: unknown) {
      this.passwordError.set(error instanceof Error ? error.message : 'Error al cambiar la contraseña');
    } finally {
      this.isSubmitting.set(false);
    }
  }

  private passwordMatchValidator(g: FormGroup) {
    return g.get('newPassword')?.value === g.get('confirmPassword')?.value
      ? null
      : { mismatch: true };
  }

  // ── Handlers ──────────────────────────────────────────────────────────────────
  onCountryChange(option: SelectOption): void {
    const country = this.countries.find(c => c.code === option.id);
    if (country) this.selectedCountry.set(country);
  }

  onDuracionChange(option: SelectOption): void {
    const val = option.id as number;
    this.form.patchValue({ duracionConsulta: val });
    this.selectedDuracion.set(val);
  }

  onScheduleChange(horarios: HorariosLaborales): void {
    this.horariosLaborales.set(horarios);
    this.form.markAsDirty();
  }

  // ── Documentos ────────────────────────────────────────────────────────────────
  onDocFileSelected(event: { key: DocKey; file: File }): void {
    const { key, file } = event;
    const existing = this.documentosDetalle()[key];
    if (existing?.url?.startsWith('blob:')) URL.revokeObjectURL(existing.url);

    const previewUrl = URL.createObjectURL(file);
    this.pendingDocFiles.set(key, file);
    this.documentosDetalle.update(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        url: previewUrl,
        estado: prev[key]?.estado ?? EstadoDocumento.PENDIENTE,
      },
    }));
    this.form.markAsDirty();
  }

  // ── Honorarios ────────────────────────────────────────────────────────────────
  agregarHonorario(): void {
    this.honorarios.update(h => [...h, { idEspecialidad: '', nombre: '', precio: 0 }]);
    this.form.markAsDirty();
  }

  actualizarHonorario(index: number, field: keyof HonorariosPorTratamiento, value: string | number): void {
    this.honorarios.update(h =>
      h.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
    this.form.markAsDirty();
  }

  eliminarHonorario(index: number): void {
    this.honorarios.update(h => h.filter((_, i) => i !== index));
    this.form.markAsDirty();
  }

  // ── Avatar ────────────────────────────────────────────────────────────────────
  async onAvatarFileSelected(file: File): Promise<void> {
    if (!file || !this.uid()) return;

    this.uploadingPhoto.set(true);
    try {
      const storageRef = ref(this.storage, `usuarios/${this.uid()}/perfil`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      this.form.patchValue({ fotoPerfil: url });
      this.toastService.success('Foto actualizada');
    } catch {
      this.toastService.error('Error al subir la foto');
    } finally {
      this.uploadingPhoto.set(false);
    }
  }

  removerFoto(): void {
    this.form.patchValue({ fotoPerfil: '' });
  }

  openDocUrl(url: string | null): void {
    if (url) window.open(url, '_blank');
  }
}

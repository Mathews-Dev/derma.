import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FirestoreService } from '@derma/firebase';
import { EstadoUsuario, RolUsuario, Usuario } from '@derma/models';
import {
  UiInputComponent,
  UiLoaderCardComponent,
  ToastService,
  UiDropdownSelectComponent,
  SelectOption,
  UiVerticalTabsComponent,
  VerticalTabItem,
  UiProfileAvatarComponent,
} from '@derma/ui';
import { toSignal } from '@angular/core/rxjs-interop';
import { Storage, ref, uploadBytes, getDownloadURL } from '@angular/fire/storage';
import { LayoutStateService } from '../../../core/services/layout-state.service';

interface Country {
  code: string;
  name: string;
  dialCode: string;
}

@Component({
  selector: 'derm-editar-usuario',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterModule,
    UiInputComponent,
    UiLoaderCardComponent,
    UiDropdownSelectComponent,
    UiVerticalTabsComponent,
    UiProfileAvatarComponent,
  ],
  templateUrl: './editar-usuario.component.html',
  styleUrl: './editar-usuario.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditarUsuarioComponent {
  private readonly firestoreService = inject(FirestoreService);
  private readonly toastService = inject(ToastService);
  private readonly storage = inject(Storage);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);
  private readonly layoutState = inject(LayoutStateService);

  readonly isSidebarCollapsed = this.layoutState.isSidebarCollapsed;

  readonly countries: Country[] = [
    { code: 'AR', name: 'Argentina', dialCode: '+54' },
    { code: 'ES', name: 'España',    dialCode: '+34' },
    { code: 'MX', name: 'México',    dialCode: '+52' },
    { code: 'CL', name: 'Chile',     dialCode: '+56' },
    { code: 'UY', name: 'Uruguay',   dialCode: '+598' },
    { code: 'CO', name: 'Colombia',  dialCode: '+57' },
    { code: 'BR', name: 'Brasil',    dialCode: '+55' },
    { code: 'US', name: 'EE. UU.',   dialCode: '+1' },
  ];

  readonly countryOptions: SelectOption[] = this.countries.map(c => ({
    id: c.code,
    label: `${c.dialCode} ${c.name}`,
  }));

  selectedCountry = signal<Country>(this.countries[0]);

  readonly rolOptions: SelectOption[] = [
    { id: RolUsuario.ADMIN,         label: 'Administrador' },
    { id: RolUsuario.DERMATOLOGO,   label: 'Dermatólogo' },
    { id: RolUsuario.RECEPCIONISTA, label: 'Recepcionista' },
    { id: RolUsuario.EMPLEADO,      label: 'Empleado' },
  ];

  readonly estadoOptions: SelectOption[] = [
    { id: EstadoUsuario.ACTIVO,     label: 'Activo' },
    { id: EstadoUsuario.INACTIVO,   label: 'Inactivo' },
    { id: EstadoUsuario.SUSPENDIDO, label: 'Suspendido' },
  ];

  routeParams = toSignal(this.route.paramMap);
  uid = computed(() => this.routeParams()?.get('uid') ?? '');

  isLoading      = signal(true);
  isSubmitting   = signal(false);
  uploadingPhoto = signal(false);

  activeTab      = signal<string>('personal');

  readonly tabs: VerticalTabItem[] = [
    { id: 'personal', label: 'Información personal', icon: 'user'   },
    { id: 'contacto', label: 'Contacto',              icon: 'phone'  },
    { id: 'cuenta',   label: 'Cuenta y accesos',      icon: 'shield' },
  ];

  selectedRol    = signal<string | null>(null);
  selectedEstado = signal<string | null>(null);

  form: FormGroup = this.fb.group({
    nombre:           ['', Validators.required],
    apellido:         ['', Validators.required],
    email:            ['', [Validators.required, Validators.email]],
    dni:              [''],
    telefono:         ['', Validators.required],
    rol:              ['', Validators.required],
    estado:           ['', Validators.required],
    correoVerificado: [false],
    fotoPerfil:       [''],
  });

  constructor() {
    effect(() => {
      const uid = this.uid();
      if (!uid) return;
      this.loadUsuario(uid);
    });
  }

  private async loadUsuario(uid: string): Promise<void> {
    this.isLoading.set(true);
    try {
      const data = await this.firestoreService.getDocument<Usuario>('usuarios', uid);
      if (data) {
        // Parse dial code from stored phone
        let telefonoRaw = data.telefono ?? '';
        let foundCountry = this.countries[0];
        for (const c of this.countries) {
          if (telefonoRaw.startsWith(c.dialCode)) {
            foundCountry = c;
            telefonoRaw = telefonoRaw.slice(c.dialCode.length).trimStart();
            break;
          }
        }
        this.selectedCountry.set(foundCountry);

        this.form.patchValue({
          nombre:           data.nombre,
          apellido:         data.apellido,
          email:            data.email,
          dni:              data.dni ?? '',
          telefono:         telefonoRaw,
          rol:              data.rol,
          estado:           data.estado,
          correoVerificado: data.correoVerificado,
          fotoPerfil:       data.fotoPerfil ?? '',
        });
        this.selectedRol.set(data.rol);
        this.selectedEstado.set(data.estado);
      }
    } catch {
      this.toastService.error('Error al cargar el usuario');
    } finally {
      this.isLoading.set(false);
    }
  }

  onCountryChange(option: SelectOption): void {
    const country = this.countries.find(c => c.code === option.id);
    if (country) { this.selectedCountry.set(country); }
  }

  onRolChange(option: SelectOption): void {
    this.form.patchValue({ rol: option.id as string });
    this.selectedRol.set(option.id as string);
  }

  onEstadoChange(option: SelectOption): void {
    this.form.patchValue({ estado: option.id as string });
    this.selectedEstado.set(option.id as string);
  }

  /** Llamado desde ui-profile-avatar (fileSelected output) */
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

  async onSubmit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.isSubmitting.set(true);
    try {
      // Store phone with dial code
      const dialCode = this.selectedCountry().dialCode;
      const telefono = `${dialCode} ${this.form.value.telefono ?? ''}`.trim();

      await this.firestoreService.updateDocument<Partial<Usuario>>(
        'usuarios',
        this.uid(),
        { ...this.form.value, telefono } as Partial<Usuario>,
      );
      this.toastService.success('Usuario actualizado correctamente');
      this.router.navigate(['/admin/staff']);
    } catch {
      this.toastService.error('Error al guardar los cambios');
    } finally {
      this.isSubmitting.set(false);
    }
  }

  volver(): void {
    this.router.navigate(['/admin/staff']);
  }
}

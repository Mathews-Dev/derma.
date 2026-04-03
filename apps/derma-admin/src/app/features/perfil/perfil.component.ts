import { Component, inject, signal, effect, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { AuthService, FirestoreService } from '@derma/firebase';
import { Usuario } from '@derma/models';
import { UiInputComponent, UiButtonComponent, UiPageHeaderComponent, UiDropdownSelectComponent, SelectOption, TooltipComponent, UiVerticalTabsComponent, VerticalTabItem, UiProfileAvatarComponent } from '@derma/ui';

interface Country {
  code: string;
  name: string;
  flagUrl: string;
  dialCode: string;
}

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule, 
    UiInputComponent, 
    UiButtonComponent, 
    UiPageHeaderComponent, 
    UiDropdownSelectComponent, 
    TooltipComponent,
    UiVerticalTabsComponent,
    UiProfileAvatarComponent,
  ],
  templateUrl: './perfil.component.html',
  styleUrl: './perfil.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PerfilComponent {
  private formBuilder = inject(FormBuilder);
  public authService = inject(AuthService);
  private firestoreService = inject(FirestoreService);
  private route = inject(ActivatedRoute);

  routeParams = toSignal(this.route.paramMap);
  currentUser = signal<Usuario | null>(null);
  profileForm: FormGroup;

  activeTab = signal<string>('basica');
  emailVerified = true;
  telefonoVerified = true;

  readonly tabs: VerticalTabItem[] = [
    { id: 'basica',      label: 'Información básica',  icon: 'user'      },
    { id: 'profesional', label: 'Contacto profesional', icon: 'briefcase' },
    { id: 'seguridad',   label: 'Seguridad',            icon: 'lock'      },
  ];

  passwordForm: FormGroup;
  passwordError = signal<string | null>(null);
  passwordSuccess = signal<boolean>(false);

  countries: Country[] = [
    { code: 'AR', name: 'Argentina', flagUrl: 'https://flagcdn.com/w40/ar.png', dialCode: '+54' },
    { code: 'ES', name: 'España', flagUrl: 'https://flagcdn.com/w40/es.png', dialCode: '+34' },
    { code: 'MX', name: 'México', flagUrl: 'https://flagcdn.com/w40/mx.png', dialCode: '+52' },
    { code: 'CL', name: 'Chile', flagUrl: 'https://flagcdn.com/w40/cl.png', dialCode: '+56' },
  ];

  countryOptions = signal<SelectOption[]>(
    this.countries.map(c => ({ label: `${c.dialCode} ${c.name}`, id: c.code }))
  );

  selectedCountry = signal<Country>(this.countries[0]);

  get basicaDirty(): boolean {
    return !!(this.profileForm.get('nombre')?.dirty || 
              this.profileForm.get('apellido')?.dirty || 
              this.profileForm.get('dni')?.dirty ||
              this.profileForm.get('perfil')?.dirty);
  }

  get profesionalDirty(): boolean {
    return !!(this.profileForm.get('email')?.dirty || 
              this.profileForm.get('telefono')?.dirty);
  }

  get dirtysections(): string {
    const sections = [];
    if (this.basicaDirty) sections.push('Información básica');
    if (this.profesionalDirty) sections.push('Contacto profesional');
    return sections.join(' y ');
  }

  onCancelBasica() {
    const current = this.currentUser();
    if (current) {
      this.profileForm.patchValue({
        nombre: current.nombre || '',
        apellido: current.apellido || '',
        dni: current.dni || '',
        perfil: current.fotoPerfil || ''
      });
      this.profileForm.get('nombre')?.markAsPristine();
      this.profileForm.get('apellido')?.markAsPristine();
      this.profileForm.get('dni')?.markAsPristine();
      this.profileForm.get('perfil')?.markAsPristine();
      this.imagenBase64Preview.set(current.fotoPerfil || null);
    }
  }

  onCancelProfesional() {
    const current = this.currentUser();
    if (current) {
      this.patchUserData(current);
      this.profileForm.get('email')?.markAsPristine();
      this.profileForm.get('telefono')?.markAsPristine();
    }
  }

  isSubmitting = signal(false);
  imagenBase64Preview = signal<string | null>(null);

  constructor() {
    this.profileForm = this.formBuilder.group({
      email: [{ value: '', disabled: true }],
      nombre: ['', Validators.required],
      apellido: ['', Validators.required],
      telefono: ['', Validators.required],
      dni: ['', Validators.required],
      perfil: [''],
      rol: ['']
    });

    this.passwordForm = this.formBuilder.group({
      currentPassword: ['', [Validators.required]],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });

    effect(() => {
      const authUser = this.authService.currentUser();
      const params = this.routeParams();
      const uid = params?.get('uid');

      if (!uid) return;

      if (authUser && authUser.uid === uid) {
        this.currentUser.set(authUser);
        this.patchUserData(authUser);
      } else if (uid) {
        this.firestoreService.getDocument<Usuario>('usuarios', uid).then(user => {
          if (user) {
            const viewedUser = { ...user, uid };
            this.currentUser.set(viewedUser);
            this.patchUserData(viewedUser);
          }
        });
      }
    }, { allowSignalWrites: true });
  }

  patchUserData(user: Partial<Usuario>) {
    let telefonoRaw = user.telefono || '';
    let foundCountry = this.countries[0]; 

    for (const country of this.countries) {
      if (telefonoRaw.startsWith(country.dialCode)) {
        foundCountry = country;
        telefonoRaw = telefonoRaw.replace(country.dialCode, '');
        if (country.code === 'AR' && telefonoRaw.startsWith('9')) {
          telefonoRaw = telefonoRaw.substring(1);
        }
        break;
      }
    }

    this.selectedCountry.set(foundCountry);

    this.profileForm.patchValue({
      email: user.email || '',
      nombre: user.nombre || '',
      apellido: user.apellido || '',
      telefono: telefonoRaw,
      dni: user.dni || '',
      perfil: user.fotoPerfil || '',
      rol: user.rol || ''
    });
    this.imagenBase64Preview.set(user.fotoPerfil || null);
  }

  onCountryChange(option: SelectOption) {
    const country = this.countries.find(c => c.code === option.id);
    if (country) {
      this.selectedCountry.set(country);
      this.profileForm.markAsDirty();
    }
  }

  onAvatarFileSelected(file: File): void {
    this.readFile(file).then(result => {
      this.imagenBase64Preview.set(result);
      this.profileForm.patchValue({ perfil: result });
      this.profileForm.markAsDirty();
    });
  }

  async onSubmit(): Promise<void> {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }

    if (!this.profileForm.dirty) {
      return;
    }

    const user = this.currentUser();
    if (!user || !user.uid) return;

    this.isSubmitting.set(true);
    try {
      const formVal = this.profileForm.getRawValue();
      const country = this.selectedCountry();
      let telefonoFormatted = formVal.telefono;

      if (country.code === 'AR') {
        telefonoFormatted = `${country.dialCode}9${formVal.telefono}`;
      } else {
        telefonoFormatted = `${country.dialCode}${formVal.telefono}`;
      }

      const dataToUpdate: any = {
        nombre: formVal.nombre,
        apellido: formVal.apellido,
        telefono: telefonoFormatted,
        dni: formVal.dni,
        fotoPerfil: formVal.perfil
      };

      await this.firestoreService.updateDocument('usuarios', user.uid, dataToUpdate);
      this.profileForm.markAsPristine();
    } catch (error) {
      console.error('Error al actualizar', error);
    } finally {
      this.isSubmitting.set(false);
    }
  }

  passwordMatchValidator(g: FormGroup) {
    return g.get('newPassword')?.value === g.get('confirmPassword')?.value
      ? null : { mismatch: true };
  }

  async onChangePassword() {
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
    } catch (error: any) {
      this.passwordError.set(error.message);
    } finally {
      this.isSubmitting.set(false);
    }
  }

  onCancel() {
    const current = this.currentUser();
    if (current) {
      this.patchUserData(current);
      this.profileForm.markAsPristine();
    }
  }

  private readFile(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }
}

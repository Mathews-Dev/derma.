import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators, FormControl } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { InvitacionService, AuthService } from '@derma/firebase';
import { SolicitudInvitacion } from '@derma/models';
import { UiInputComponent, UiButtonComponent, SelectOption, UiDropdownSelectComponent, LoadingService } from '@derma/ui';
import { ExpiredInvitationModalComponent } from './ui/expired-invitation-modal/expired-invitation-modal.component';

interface Country {
  code: string;
  name: string;
  flagUrl: string;
  dialCode: string;
}

@Component({
  selector: 'derm-register-staff',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ReactiveFormsModule, UiInputComponent, UiButtonComponent, UiDropdownSelectComponent, ExpiredInvitationModalComponent],
  templateUrl: './register-staff.component.html',
  styleUrls: ['./register-staff.component.css']
})
export class RegisterStaffComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private invitacionService = inject(InvitacionService);
  private authService = inject(AuthService);
  private fb = inject(FormBuilder);
  private loadingService = inject(LoadingService);

  codigo = '';
  invitacion = signal<SolicitudInvitacion | null>(null);
  error = signal<string>('');
  isSubmitting = signal(false);
  isExpired = signal(false);
  readyToShow = signal(false);
  private hasStartedValidation = false;

  formulario = this.fb.nonNullable.group({
    nombre: ['', Validators.required],
    apellido: ['', Validators.required],
    dni: ['', Validators.required],
    telefono: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  countryControl = new FormControl<string>('AR', Validators.required);

  countries: Country[] = [
    { code: 'AR', name: 'Argentina', flagUrl: 'https://flagcdn.com/w40/ar.png', dialCode: '+54' },
    { code: 'ES', name: 'España', flagUrl: 'https://flagcdn.com/w40/es.png', dialCode: '+34' },
    { code: 'MX', name: 'México', flagUrl: 'https://flagcdn.com/w40/mx.png', dialCode: '+52' },
    { code: 'CL', name: 'Chile', flagUrl: 'https://flagcdn.com/w40/cl.png', dialCode: '+56' },
  ];

  countryOptions = signal<SelectOption[]>(
    this.countries.map(c => ({ label: `${c.dialCode} ${c.name}`, id: c.code }))
  );

  selectedCountry = signal<Country>(this.countries[0]); // Default Argentina

  ngOnInit() {
    this.validarInvitacionDelLink();
  }

  async validarInvitacionDelLink() {
    if (this.hasStartedValidation) return;
    this.hasStartedValidation = true;

    const validationPromise = (async () => {
      try {
        this.codigo = this.route.snapshot.params['codigo'];
        if (!this.codigo) {
          this.router.navigate(['/auth/login']);
          return;
        }

        const invitacion = await this.invitacionService.validarInvitacion(this.codigo);
        this.invitacion.set(invitacion);

      } catch (error: unknown) {
        const msg = this.getErrorMessage(error, 'Error validando la invitacion');
        
        if (msg === 'El código de invitación ha expirado') {
          this.isExpired.set(true);
        } else {
          this.router.navigate(['/auth/login']);
          return;
        }
      } finally {
        this.readyToShow.set(true);
        await new Promise(resolve => setTimeout(resolve, 300));
      }
    })();

    await this.loadingService.showWhile(validationPromise);
  }

  goToLogin() {
    this.router.navigate(['/auth/login']);
  }

  onCountryChange(option: SelectOption) {
    const country = this.countries.find(c => c.code === option.id);
    if (country) {
      this.selectedCountry.set(country);
    }
  }

  async onSubmit() {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }

    const registrationPromise = async () => {
      const invitacion = this.invitacion();

      if (!invitacion) {
        throw new Error('Invitacion no valida');
      }

      const { email, password, nombre, apellido, dni, telefono } = this.formulario.getRawValue();

      const country = this.selectedCountry();
      let telefonoFormatted = telefono;

      if (country.code === 'AR') {
        telefonoFormatted = `${country.dialCode}9${telefono}`;
      } else {
        telefonoFormatted = `${country.dialCode}${telefono}`;
      }

      const usuarioObj = await this.authService.register({
        email,
        password,
        nombre,
        apellido,
        dni,
        telefono: telefonoFormatted,
        rol: invitacion.rol
      });

      if (usuarioObj) {
        await this.invitacionService.marcarInvitacionComoUsada(
          this.codigo,
          usuarioObj.uid
        );
      }

      await this.router.navigate(['/']);
    };

    this.isSubmitting.set(true);
    this.error.set('');

    try {
      await this.loadingService.showWhile(registrationPromise());
    } catch (error: unknown) {
      this.error.set(this.getErrorMessage(error, 'Error al registrar'));
    } finally {
      this.isSubmitting.set(false);
    }
  }

  private getErrorMessage(error: unknown, fallback: string): string {
    if (error instanceof Error) {
      return error.message;
    }

    return fallback;
  }

  
  get nombreControl() { return this.formulario.controls.nombre; }

  get apellidoControl() { return this.formulario.controls.apellido; }

  get dniControl() { return this.formulario.controls.dni; }

  get telefonoControl() { return this.formulario.controls.telefono; }

  get emailControl() { return this.formulario.controls.email; }

  get passwordControl() { return this.formulario.controls.password; }
}

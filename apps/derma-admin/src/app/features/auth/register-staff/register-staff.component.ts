import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { InvitacionService, AuthService } from '@derma/firebase';
import { SolicitudInvitacion } from '@derma/models';

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
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './register-staff.component.html',
  styleUrls: ['./register-staff.component.css']
})
export class RegisterStaffComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private invitacionService = inject(InvitacionService);
  private authService = inject(AuthService);
  private fb = inject(FormBuilder);

  codigo = '';
  invitacion = signal<SolicitudInvitacion | null>(null);
  error = signal<string>('');
  isLoading = signal(true);
  isSubmitting = signal(false);

  formulario = this.fb.nonNullable.group({
    nombre: ['', Validators.required],
    apellido: ['', Validators.required],
    dni: ['', Validators.required],
    telefono: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  countries: Country[] = [
    { code: 'AR', name: 'Argentina', flagUrl: 'https://flagcdn.com/w40/ar.png', dialCode: '+54' },
    { code: 'ES', name: 'España', flagUrl: 'https://flagcdn.com/w40/es.png', dialCode: '+34' },
    { code: 'MX', name: 'México', flagUrl: 'https://flagcdn.com/w40/mx.png', dialCode: '+52' },
    { code: 'CL', name: 'Chile', flagUrl: 'https://flagcdn.com/w40/cl.png', dialCode: '+56' },
  ];

  selectedCountry = signal<Country>(this.countries[0]); // Default Argentina

  ngOnInit() {
    this.validarInvitacionDelLink();
  }

  async validarInvitacionDelLink() {
    this.isLoading.set(true);

    try {
      this.codigo = this.route.snapshot.params['codigo'];

      if (!this.codigo) {
        this.router.navigate(['/auth/login']);
        return;
      }

      const invitacion = await this.invitacionService.validarInvitacion(this.codigo);
      this.invitacion.set(invitacion);

    } catch (error: unknown) {
      this.error.set(this.getErrorMessage(error, 'Error validando la invitacion'));
    } finally {
      this.isLoading.set(false);
      if (!this.invitacion() && !this.error()) {
        this.router.navigate(['/auth/login']);
      }
    }
  }

  onCountryChange(event: Event) {
    const code = (event.target as HTMLSelectElement).value;
    const country = this.countries.find(c => c.code === code);
    if (country) {
      this.selectedCountry.set(country);
    }
  }

  async onSubmit() {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.error.set('');

    try {
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

      // El registro lo debe manejar el authService, ajustando rol
      // Aqui asumimos que AuthService#register soporta pasar toda la info.
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

      this.router.navigate(['/']);

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

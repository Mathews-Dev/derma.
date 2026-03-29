import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '@derma/firebase';

import { Router } from '@angular/router';
import { UiButtonComponent, UiInputComponent } from '@derma/ui';
import { LoadingService } from '@derma/ui';

@Component({
  selector: 'derm-admin-login',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ReactiveFormsModule, UiButtonComponent, UiInputComponent],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  private authService = inject(AuthService);
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private loadingService = inject(LoadingService);

  formulario = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  error = signal<string>('');

  
  async onSubmit() {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }

    this.error.set('');

    const loginPromise = async () => {
      try {
        const { email, password } = this.formulario.getRawValue();
        await this.authService.login({ email, password }, { navigate: false });
        await this.router.navigate(['/admin/dashboard']);
      } catch (error: unknown) {
        this.error.set(this.getErrorMessage(error, 'Error al iniciar sesion'));
        // Re-throw the error to be caught by showWhile
        throw error;
      }
    };

    await this.loadingService.showWhile(loginPromise());
  }

  async loginWithGoogle() {
    this.error.set('');
    const googleLoginPromise = async () => {
      try {
        await this.authService.loginWithGoogle();
        await this.router.navigate(['/admin/dashboard']);
      } catch (error) {
        this.error.set(this.getErrorMessage(error, 'Error al iniciar sesión con Google'));
        throw error;
      }
    };
    await this.loadingService.showWhile(googleLoginPromise());
  }

  private getErrorMessage(error: unknown, fallback: string): string {
    if (error instanceof Error) {
      return error.message;
    }

    return fallback;
  }
}

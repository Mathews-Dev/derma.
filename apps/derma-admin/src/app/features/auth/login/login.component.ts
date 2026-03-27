import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '@derma/firebase';

import { Router } from '@angular/router';
import { UiButtonComponent, UiInputComponent } from '@derma/ui';

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

  formulario = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  isLoading = signal(false);
  error = signal<string>('');

  
  async onSubmit() {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.error.set('');

    try {
      const { email, password } = this.formulario.getRawValue();

    
      await this.authService.login({ email, password });
      // Redirigir según el rol debería estar ya manejado por authService o por guard
      this.router.navigate(['/']);
    } catch (error: unknown) {
      this.error.set(this.getErrorMessage(error, 'Error al iniciar sesion'));
    } finally {
      this.isLoading.set(false);
    }
  }

  private getErrorMessage(error: unknown, fallback: string): string {
    if (error instanceof Error) {
      return error.message;
    }

    return fallback;
  }
}

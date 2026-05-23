import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  AuthService,
  consumeAuthReturnUrl,
  isSafeReturnUrl,
} from '@derma/firebase';
import { UiButtonComponent, UiInputComponent } from '@derma/ui';

@Component({
  selector: 'derm-patient-login',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, UiButtonComponent, UiInputComponent],
  template: `
    <main class="mx-auto max-w-md p-6">
      <h1 class="text-2xl font-semibold text-slate-900">Ingresá a Derma</h1>
      <form class="mt-6 space-y-4" [formGroup]="form" (ngSubmit)="onSubmit()">
        <ui-input label="Email" type="email" [control]="form.controls.email" />
        <ui-input label="Contraseña" type="password" [control]="form.controls.password" />
        @if (error()) {
          <p class="text-sm text-red-600">{{ error() }}</p>
        }
        <ui-button label="Iniciar sesión" type="submit" [isLoading]="loading()" />
      </form>
      <p class="mt-4 text-sm text-slate-500">
        Si no tenés cuenta, contactá a recepción para activar tu acceso.
      </p>
    </main>
  `,
})
export class PatientLoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly loading = signal(false);
  readonly error = signal('');

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  async onSubmit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading.set(true);
    this.error.set('');
    const fromQuery = this.route.snapshot.queryParamMap.get('returnUrl');
    const returnUrl =
      (fromQuery && isSafeReturnUrl(fromQuery) ? fromQuery : null) ?? consumeAuthReturnUrl();
    try {
      const { email, password } = this.form.getRawValue();
      await this.auth.login(
        { email, password },
        { navigate: false, returnUrl },
      );
      const user = this.auth.currentUser();
      if (user) {
        this.auth.navigateAfterLogin(user.rol, returnUrl);
      }
    } catch (e) {
      this.error.set(e instanceof Error ? e.message : 'Error al iniciar sesión');
    } finally {
      this.loading.set(false);
    }
  }
}

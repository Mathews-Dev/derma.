import { Route } from '@angular/router';
import { authGuard, noAuthGuard } from '@derma/guards';

export const appRoutes: Route[] = [
  {
    path: 't/:accessToken',
    loadComponent: () =>
      import('./features/turno/turno-portal.component').then(m => m.TurnoPortalComponent),
  },
  {
    path: 'reprogramar',
    loadComponent: () =>
      import('./features/reprogramar/reprogramar-landing.component').then(
        m => m.ReprogramarLandingComponent,
      ),
  },
  {
    path: 'auth/login',
    loadComponent: () =>
      import('./features/auth/login/login.component').then(m => m.PatientLoginComponent),
    canActivate: [noAuthGuard],
  },
  {
    path: 'turnos',
    loadComponent: () =>
      import('./features/turnos/mis-turnos-placeholder.component').then(
        m => m.MisTurnosPlaceholderComponent,
      ),
    canActivate: [authGuard],
  },
  {
    path: '',
    redirectTo: 'reprogramar',
    pathMatch: 'full',
  },
  {
    path: '**',
    redirectTo: 'reprogramar',
  },
];

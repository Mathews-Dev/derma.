import { Route } from '@angular/router';

export const notificacionesRoutes: Route[] = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/notificaciones-page/notificaciones-page.component').then(
        m => m.NotificacionesPageComponent,
      ),
  },
];

import { Route } from '@angular/router';

export const tareasRoutes: Route[] = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/tareas-admin/tareas-admin.component').then(
        m => m.TareasAdminComponent,
      ),
  },
  {
    path: 'historial',
    loadComponent: () =>
      import('./pages/tareas-historial/tareas-historial.component').then(
        m => m.TareasHistorialComponent,
      ),
  },
];

export const misTareasRoutes: Route[] = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/mis-tareas/mis-tareas.component').then(
        m => m.MisTareasComponent,
      ),
  },
];

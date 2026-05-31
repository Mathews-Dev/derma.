import { Route } from '@angular/router';
import { roleGuard } from '@derma/guards';
import { RolUsuario } from '@derma/models';

const { ADMIN, DERMATOLOGO, RECEPCIONISTA, EMPLEADO } = RolUsuario;

export const insumosRoutes: Route[] = [
  {
    path: '',
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./pages/insumos-list/insumos-list.component').then(m => m.InsumosListComponent),
      },
      {
        path: 'nuevo',
        canActivate: [roleGuard([ADMIN, DERMATOLOGO, RECEPCIONISTA])],
        loadComponent: () =>
          import('./pages/insumos-form/insumos-form.component').then(m => m.InsumosFormComponent),
      },
      {
        path: ':id',
        loadComponent: () =>
          import('./pages/insumo-detail/insumo-detail.component').then(m => m.InsumoDetailComponent),
      },
      {
        path: ':id/editar',
        canActivate: [roleGuard([ADMIN, DERMATOLOGO, RECEPCIONISTA])],
        loadComponent: () =>
          import('./pages/insumos-form/insumos-form.component').then(m => m.InsumosFormComponent),
      },
      {
        path: ':id/solicitar',
        canActivate: [roleGuard([ADMIN, DERMATOLOGO, RECEPCIONISTA, EMPLEADO])],
        loadComponent: () =>
          import('./pages/solicitud-reposicion/solicitud-reposicion.component').then(m => m.SolicitudReposicionComponent),
      },
    ],
  },
];

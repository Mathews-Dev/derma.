import { Route } from '@angular/router';
import { roleGuard } from '@derma/guards';
import { RolUsuario } from '@derma/models';

const roles = [RolUsuario.ADMIN, RolUsuario.DERMATOLOGO, RolUsuario.RECEPCIONISTA];

export const videoconsultaRoutes: Route[] = [
  {
    path: '',
    canActivate: [roleGuard(roles)],
    loadComponent: () =>
      import('./pages/videoconsulta-list/videoconsulta-list.component').then(
        m => m.VideoconsultaListComponent,
      ),
  },
  {
    path: ':id',
    canActivate: [roleGuard(roles)],
    loadComponent: () =>
      import('./pages/videoconsulta-detalle/videoconsulta-detalle.component').then(
        m => m.VideoconsultaDetalleComponent,
      ),
  },
];

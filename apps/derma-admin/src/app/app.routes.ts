import { Route } from '@angular/router';
import { authGuard, noAuthGuard, roleGuard } from '@derma/guards';
import { RolUsuario } from '@derma/models';

export const appRoutes: Route[] = [
  {
    path: 'auth',
    loadChildren: () => import('./features/auth/auth.routes').then(m => m.authRoutes),
    canActivate: [noAuthGuard]
  },
  {
    path: 'admin',
    canActivate: [authGuard, roleGuard([RolUsuario.ADMIN, RolUsuario.DERMATOLOGO, RolUsuario.RECEPCIONISTA, RolUsuario.EMPLEADO])],
    loadComponent: () => import('./layouts/private-layout/private-layout.component').then(m => m.PrivateLayoutComponent),
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent)
      },
      {
        path: 'agenda',
        canActivate: [roleGuard([RolUsuario.ADMIN, RolUsuario.DERMATOLOGO, RolUsuario.RECEPCIONISTA])],
        loadComponent: () => import('./features/agenda/agenda.component').then(m => m.AgendaComponent)
      },
      {
        path: 'pacientes',
        canActivate: [roleGuard([RolUsuario.ADMIN, RolUsuario.DERMATOLOGO, RolUsuario.RECEPCIONISTA])],
        loadComponent: () => import('./features/pacientes/pacientes.component').then(m => m.PacientesComponent)
      },
      {
        path: 'historial',
        canActivate: [roleGuard([RolUsuario.ADMIN, RolUsuario.DERMATOLOGO])],
        loadComponent: () => import('./features/historial/historial.component').then(m => m.HistorialComponent)
      },
      {
        path: 'tratamientos',
        canActivate: [roleGuard([RolUsuario.ADMIN, RolUsuario.DERMATOLOGO])],
        loadComponent: () => import('./features/tratamientos/tratamientos.component').then(m => m.TratamientosComponent)
      },
      {
        path: 'invitaciones',
        canActivate: [roleGuard(RolUsuario.ADMIN)],
        loadComponent: () => import('./features/invitaciones/invitaciones.component').then(m => m.InvitacionesComponent)
      },
      {
        path: 'staff',
        canActivate: [roleGuard(RolUsuario.ADMIN)],
        loadComponent: () => import('./features/staff/staff.component').then(m => m.StaffComponent)
      },
      {
        path: 'staff/editar/:uid',
        canActivate: [roleGuard(RolUsuario.ADMIN)],
        loadComponent: () => import('./features/staff/editar-usuario/editar-usuario.component').then(m => m.EditarUsuarioComponent)
      },
      {
        path: 'staff/editar-profesional/:uid',
        canActivate: [roleGuard(RolUsuario.ADMIN)],
        loadComponent: () => import('./features/staff/editar-profesional/editar-profesional.component').then(m => m.EditarProfesionalComponent)
      },
      {
        path: 'configuracion',
        loadComponent: () => import('./features/configuracion/configuracion.component').then(m => m.ConfiguracionComponent)
      },
      {
        path: 'perfil/:uid',
        loadComponent: () => import('./features/perfil/perfil.component').then(m => m.PerfilComponent)
      },
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'dashboard'
      }
    ]
  },
  {
    path: '',
    redirectTo: 'admin/dashboard',
    pathMatch: 'full'
  },
  {
    path: '**',
    redirectTo: 'admin/dashboard'
  }
];

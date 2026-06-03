import { Route } from '@angular/router';
import { authGuard, noAuthGuard, roleGuard } from '@derma/guards';
import { RolUsuario } from '@derma/models';
import { InventarioAlertasSyncService } from './core/services/inventario-alertas-sync.service';
import { NotificacionesStateService } from './core/services/notificaciones-state.service';

const rolesAgendaVcPacientes = [
  RolUsuario.ADMIN,
  RolUsuario.DERMATOLOGO,
  RolUsuario.RECEPCIONISTA,
] as const;

const rolesInsumosEditor = [RolUsuario.ADMIN, RolUsuario.DERMATOLOGO, RolUsuario.RECEPCIONISTA];
const rolesInsumosSolicitud = [
  RolUsuario.ADMIN,
  RolUsuario.DERMATOLOGO,
  RolUsuario.RECEPCIONISTA,
  RolUsuario.EMPLEADO,
];

export const appRoutes: Route[] = [
  {
    path: 'success',
    loadComponent: () =>
      import('./features/pagos/pages/mp-return/mp-return.component').then(m => m.MpReturnPageComponent),
  },
  {
    path: 'failure',
    loadComponent: () =>
      import('./features/pagos/pages/mp-return/mp-return.component').then(m => m.MpReturnPageComponent),
  },
  {
    path: 'pending',
    loadComponent: () =>
      import('./features/pagos/pages/mp-return/mp-return.component').then(m => m.MpReturnPageComponent),
  },
  {
    path: 'auth',
    loadChildren: () => import('./features/auth/auth.routes').then(m => m.authRoutes),
    canActivate: [noAuthGuard],
  },
  {
    path: 'admin',
    canActivate: [
      authGuard,
      roleGuard([RolUsuario.ADMIN, RolUsuario.DERMATOLOGO, RolUsuario.RECEPCIONISTA, RolUsuario.EMPLEADO]),
    ],
    providers: [NotificacionesStateService, InventarioAlertasSyncService],
    loadComponent: () =>
      import('./layouts/private-layout/private-layout.component').then(m => m.PrivateLayoutComponent),
    children: [
      {
        path: 'dashboard',
        data: { preload: true },
        loadComponent: () =>
          import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
      },
      {
        path: 'agenda',
        canActivate: [roleGuard([...rolesAgendaVcPacientes])],
        data: { preload: true },
        loadComponent: () =>
          import('./features/agenda/agenda.component').then(m => m.AgendaComponent),
      },
      {
        path: 'agenda/profesional',
        canActivate: [roleGuard([...rolesAgendaVcPacientes])],
        loadComponent: () =>
          import('./features/agenda/agenda.component').then(m => m.AgendaComponent),
      },
      {
        path: 'videoconsultas',
        canActivate: [roleGuard([...rolesAgendaVcPacientes])],
        data: { preload: true },
        loadComponent: () =>
          import('./features/videoconsulta/pages/videoconsulta-list/videoconsulta-list.component').then(
            m => m.VideoconsultaListComponent,
          ),
      },
      {
        path: 'videoconsultas/:id',
        canActivate: [roleGuard([...rolesAgendaVcPacientes])],
        loadComponent: () =>
          import('./features/videoconsulta/pages/videoconsulta-redirect/videoconsulta-redirect.component').then(
            m => m.VideoconsultaRedirectComponent,
          ),
      },
      {
        path: 'pacientes',
        canActivate: [roleGuard([...rolesAgendaVcPacientes])],
        data: { preload: true },
        loadComponent: () =>
          import('./features/pacientes/pacientes.component').then(m => m.PacientesComponent),
      },
      {
        path: 'historial',
        canActivate: [roleGuard([RolUsuario.ADMIN, RolUsuario.DERMATOLOGO])],
        loadComponent: () =>
          import('./features/historial/historial.component').then(m => m.HistorialComponent),
      },
      {
        path: 'tratamientos',
        canActivate: [roleGuard([RolUsuario.ADMIN, RolUsuario.DERMATOLOGO])],
        loadComponent: () =>
          import('./features/tratamientos/tratamientos.component').then(m => m.TratamientosComponent),
      },
      {
        path: 'tratamientos/nuevo',
        canActivate: [roleGuard(RolUsuario.ADMIN)],
        loadComponent: () =>
          import('./features/tratamientos/editar-tratamiento/editar-tratamiento.component').then(
            m => m.EditarTratamientoComponent,
          ),
      },
      {
        path: 'tratamientos/:id',
        canActivate: [roleGuard([RolUsuario.ADMIN, RolUsuario.DERMATOLOGO])],
        loadComponent: () =>
          import('./features/tratamientos/editar-tratamiento/editar-tratamiento.component').then(
            m => m.EditarTratamientoComponent,
          ),
      },
      {
        path: 'invitaciones',
        canActivate: [roleGuard(RolUsuario.ADMIN)],
        loadComponent: () =>
          import('./features/invitaciones/invitaciones.component').then(m => m.InvitacionesComponent),
      },
      {
        path: 'staff',
        canActivate: [roleGuard(RolUsuario.ADMIN)],
        loadComponent: () => import('./features/staff/staff.component').then(m => m.StaffComponent),
      },
      {
        path: 'staff/editar/:uid',
        canActivate: [roleGuard(RolUsuario.ADMIN)],
        loadComponent: () =>
          import('./features/staff/editar-usuario/editar-usuario.component').then(
            m => m.EditarUsuarioComponent,
          ),
      },
      {
        path: 'staff/editar-profesional/:uid',
        canActivate: [roleGuard(RolUsuario.ADMIN)],
        loadComponent: () =>
          import('./features/staff/editar-profesional/editar-profesional.component').then(
            m => m.EditarProfesionalComponent,
          ),
      },
      {
        path: 'tareas',
        canActivate: [roleGuard([RolUsuario.ADMIN])],
        loadComponent: () =>
          import('./features/tareas/pages/tareas-admin/tareas-admin.component').then(
            m => m.TareasAdminComponent,
          ),
      },
      {
        path: 'tareas/historial',
        canActivate: [roleGuard([RolUsuario.ADMIN])],
        loadComponent: () =>
          import('./features/tareas/pages/tareas-historial/tareas-historial.component').then(
            m => m.TareasHistorialComponent,
          ),
      },
      {
        path: 'mis-tareas',
        canActivate: [roleGuard([RolUsuario.DERMATOLOGO, RolUsuario.RECEPCIONISTA, RolUsuario.EMPLEADO])],
        loadComponent: () =>
          import('./features/tareas/pages/mis-tareas/mis-tareas.component').then(m => m.MisTareasComponent),
      },
      {
        path: 'insumos',
        loadComponent: () =>
          import('./features/insumos/pages/insumos-list/insumos-list.component').then(
            m => m.InsumosListComponent,
          ),
      },
      {
        path: 'insumos/nuevo',
        canActivate: [roleGuard(rolesInsumosEditor)],
        loadComponent: () =>
          import('./features/insumos/pages/insumos-form/insumos-form.component').then(
            m => m.InsumosFormComponent,
          ),
      },
      {
        path: 'insumos/:id/editar',
        canActivate: [roleGuard(rolesInsumosEditor)],
        loadComponent: () =>
          import('./features/insumos/pages/insumos-form/insumos-form.component').then(
            m => m.InsumosFormComponent,
          ),
      },
      {
        path: 'insumos/:id/solicitar',
        canActivate: [roleGuard(rolesInsumosSolicitud)],
        loadComponent: () =>
          import('./features/insumos/pages/solicitud-reposicion/solicitud-reposicion.component').then(
            m => m.SolicitudReposicionComponent,
          ),
      },
      {
        path: 'insumos/:id',
        loadComponent: () =>
          import('./features/insumos/pages/insumo-detail/insumo-detail.component').then(
            m => m.InsumoDetailComponent,
          ),
      },
      {
        path: 'notificaciones',
        canActivate: [roleGuard([RolUsuario.ADMIN, RolUsuario.EMPLEADO])],
        loadComponent: () =>
          import('./features/notificaciones/pages/notificaciones-page/notificaciones-page.component').then(
            m => m.NotificacionesPageComponent,
          ),
      },
      {
        path: 'configuracion',
        loadComponent: () =>
          import('./features/configuracion/configuracion.component').then(m => m.ConfiguracionComponent),
      },
      {
        path: 'perfil/profesional',
        canActivate: [roleGuard([RolUsuario.DERMATOLOGO])],
        loadComponent: () =>
          import('./features/perfil/perfil-profesional/perfil-profesional.component').then(
            m => m.PerfilProfesionalComponent,
          ),
      },
      {
        path: 'perfil/:uid',
        loadComponent: () =>
          import('./features/perfil/perfil.component').then(m => m.PerfilComponent),
      },
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'dashboard',
      },
    ],
  },
  {
    path: '',
    redirectTo: 'admin/dashboard',
    pathMatch: 'full',
  },
  {
    path: '**',
    redirectTo: 'admin/dashboard',
  },
];

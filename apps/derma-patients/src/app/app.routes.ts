import { Route } from '@angular/router';
import { authGuard, noAuthGuard } from '@derma/guards';

export const appRoutes: Route[] = [
  // {
  //   path: '',
  //   loadComponent: () => import('./features/home/home.component').then(m => m.HomeComponent),
  // },
  // {
  //   path: 'auth/login',
  //   loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent),
  //   canActivate: [noAuthGuard]
  // },
  // {
  //   path: 'auth/registro',
  //   loadComponent: () => import('./features/auth/registro/registro.component').then(m => m.RegistroComponent),
  //   canActivate: [noAuthGuard]
  // },
  // {
  //   path: 'turnos',
  //   loadComponent: () => import('./features/turnos/mis-turnos/mis-turnos.component').then(m => m.MisTurnosComponent),
  //   canActivate: [authGuard]
  // },
  // {
  //   path: 'turnos/reservar',
  //   loadComponent: () => import('./features/turnos/reserva-turno/reserva-turno.component').then(m => m.ReservaTurnoComponent),
  //   canActivate: [authGuard]
  // },
  // {
  //   path: 'historial',
  //   loadComponent: () => import('./features/historial/historial.component').then(m => m.HistorialComponent),
  //   canActivate: [authGuard]
  // },
  // {
  //   path: 'perfil',
  //   loadComponent: () => import('./features/perfil/perfil.component').then(m => m.PerfilComponent),
  //   canActivate: [authGuard]
  // },
  // {
  //   path: 'tratamientos',
  //   loadComponent: () => import('./features/tratamientos/tratamientos.component').then(m => m.TratamientosComponent)
  // },
  // {
  //   path: '**',
  //   redirectTo: ''
  // }
];

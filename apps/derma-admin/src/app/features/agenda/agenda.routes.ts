import { Routes } from '@angular/router';

export const agendaRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./agenda.component').then(m => m.AgendaComponent)
  },
  {
    path: 'profesional',
    loadComponent: () => import('./agenda.component').then(m => m.AgendaComponent) 
    // Por ahora usamos el mismo diseño, luego se puede especializar
  }
];

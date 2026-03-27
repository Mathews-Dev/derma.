import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '@derma/firebase';
import { RolUsuario } from '@derma/models';

export const roleGuard = (allowedRoles: RolUsuario | RolUsuario[]): CanActivateFn => {
  return () => {
    const authService = inject(AuthService);
    const router = inject(Router);
    const user = authService.currentUser();
    
    if (!user) {
      return router.parseUrl('/auth/login');
    }

    const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

    if (roles.includes(user.rol)) {
      return true;
    }

    if (user.rol === RolUsuario.PACIENTE) {
      return router.parseUrl('/paciente');
    }
    return router.parseUrl('/admin');
  };
};

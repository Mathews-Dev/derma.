import { inject } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { AuthService } from '@derma/firebase';
import { RolUsuario } from '@derma/models';
import { filter, map, take } from 'rxjs';

export const roleGuard = (allowedRoles: RolUsuario | RolUsuario[]): CanActivateFn => {
  return () => {
    const authService = inject(AuthService);
    const router = inject(Router);

    return toObservable(authService.isAuthStatusLoaded).pipe(
      filter(loaded => loaded),
      take(1),
      map((): boolean | UrlTree => {
        const user = authService.currentUser();

        if (!user) return router.parseUrl('/auth/login');

        const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
        if (roles.includes(user.rol)) return true;

        return user.rol === RolUsuario.PACIENTE
          ? router.parseUrl('/paciente')
          : router.parseUrl('/admin');
      })
    );
  };
};

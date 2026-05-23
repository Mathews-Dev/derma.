import { inject } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService, consumeAuthReturnUrl, isSafeReturnUrl } from '@derma/firebase';
import { filter, map, take } from 'rxjs';

export const noAuthGuard: CanActivateFn = (route) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return toObservable(authService.isAuthStatusLoaded).pipe(
    filter(loaded => loaded),
    take(1),
    map(() => {
      if (!authService.isLoggedIn()) return true;
      const q = route.queryParamMap.get('returnUrl');
      const stored = consumeAuthReturnUrl();
      const target = (q && isSafeReturnUrl(q) ? q : null) ?? stored;
      if (target) return router.parseUrl(target);
      const user = authService.currentUser();
      if (user) {
        authService.navigateAfterLogin(user.rol, null);
      }
      return router.parseUrl('/turnos');
    }),
  );
};

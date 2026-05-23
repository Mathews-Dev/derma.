import { inject } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '@derma/firebase';
import { filter, map, take } from 'rxjs';

export const authGuard: CanActivateFn = (_route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return toObservable(authService.isAuthStatusLoaded).pipe(
    filter(loaded => loaded),
    take(1),
    map(() => {
      if (authService.isLoggedIn()) return true;
      return router.createUrlTree(['/auth/login'], {
        queryParams: { returnUrl: state.url },
      });
    }),
  );
};

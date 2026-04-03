import { inject } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '@derma/firebase';
import { filter, map, take } from 'rxjs';

export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return toObservable(authService.isAuthStatusLoaded).pipe(
    filter(loaded => loaded),
    take(1),
    map(() => authService.isLoggedIn() || router.parseUrl('/auth/login'))
  );
};

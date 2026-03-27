import { HttpInterceptorFn } from '@angular/common/http';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req).pipe(
    catchError((error) => {
      console.error('HTTP Error Interceptor:', error);
      const errorMsg = error.error?.message || error.message || 'Ocurrió un error inesperado';
      console.error("Notificación de error:", errorMsg);
      return throwError(() => error);
    })
  );
};

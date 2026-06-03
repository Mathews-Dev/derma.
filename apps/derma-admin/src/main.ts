import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

/** Tras un deploy, el navegador puede pedir chunks viejos → Firebase devuelve index.html y falla el import. */
function setupChunkLoadRecovery(): void {
  const reloadKey = 'derma-admin-chunk-reload';
  window.addEventListener('unhandledrejection', event => {
    const msg = String(
      (event.reason as { message?: string } | undefined)?.message ?? event.reason ?? '',
    );
    if (!msg.includes('Failed to fetch dynamically imported module')) return;
    if (sessionStorage.getItem(reloadKey)) {
      sessionStorage.removeItem(reloadKey);
      return;
    }
    sessionStorage.setItem(reloadKey, '1');
    window.location.reload();
  });
  window.setTimeout(() => sessionStorage.removeItem(reloadKey), 10_000);
}

setupChunkLoadRecovery();

bootstrapApplication(App, appConfig).catch((err) => console.error(err));

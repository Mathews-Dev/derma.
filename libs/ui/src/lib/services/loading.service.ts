import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class LoadingService {
  readonly isVisible = signal(false);
  readonly progress = signal(0);

  private activePromises = 0;
  private rafId: number | null = null;
  private finalizeTimeoutId: any = null;
  private resetTimeoutId: any = null;

  show(): void {
    this.clearPendingActions();
    this.progress.set(0);
    this.isVisible.set(true);
  }

  hide(): void {
    this.clearPendingActions();
    this.isVisible.set(false);
    this.progress.set(0);
  }

  showWhile<T>(promise: Promise<T>): Promise<T> {
    this.activePromises++;

    if (this.activePromises === 1) {
      this.startLoading();
    }

    promise.finally(() => {
      this.activePromises--;
      
      if (this.activePromises === 0) {
        this.finalise();
      }
    });

    return promise;
  }

  private startLoading() {
    this.clearPendingActions();
    this.isVisible.set(true);
    
    // Solo reseteamos progreso si veníamos de una carga anterior o estamos en 0
    if (this.progress() >= 100 || this.progress() === 0) {
      this.progress.set(0);
    }

    this.animate();
  }

  private animate() {
    if (this.rafId) cancelAnimationFrame(this.rafId);

    const animateProgress = () => {
      const current = this.progress();
      const target = 60;

      // Solo animamos si no hemos llegado a la meseta del 100%
      if (current < target - 0.2) {
        const newProgress = current + (target - current) * 0.05;
        this.progress.set(newProgress);
        this.rafId = requestAnimationFrame(animateProgress);
      } else {
        this.progress.set(target);
        this.rafId = null;
      }
    };

    this.rafId = requestAnimationFrame(animateProgress);
  }

  private finalise() {
    this.clearPendingActions();

    // Forzamos el salto al 100
    this.progress.set(100);

    // Desvanecemos después de una meseta de seguridad
    this.finalizeTimeoutId = setTimeout(() => {
      this.isVisible.set(false);
      this.resetTimeoutId = setTimeout(() => {
        // Solo reseteamos a 0 si no han entrado nuevas tareas durante el desvanecimiento
        if (this.activePromises === 0) {
          this.progress.set(0);
        }
      }, 300);
    }, 400);
  }

  private clearPendingActions() {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    if (this.finalizeTimeoutId) {
      clearTimeout(this.finalizeTimeoutId);
      this.finalizeTimeoutId = null;
    }
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
      this.resetTimeoutId = null;
    }
  }
}
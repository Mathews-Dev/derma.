import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class LoadingService {
  readonly isVisible = signal(false);
  readonly progress = signal(0);

  show(): void {
    this.progress.set(0);
    this.isVisible.set(true);
  }

  hide(): void {
    this.isVisible.set(false);
    this.progress.set(0);
  }

  showWhile<T>(promise: Promise<T>): Promise<T> {
    this.progress.set(0);
    this.isVisible.set(true);

    let rafId: number;
    let isPromiseDone = false;

    const finalise = () => {
      cancelAnimationFrame(rafId);
      this.progress.set(100);
      setTimeout(() => {
        this.isVisible.set(false);
        setTimeout(() => this.progress.set(0), 300);
      }, 400);
    };

    const animateProgress = () => {
      if (isPromiseDone) {
        finalise();
        return;
      }

      const current = this.progress();
      const target = 60;

      if (current < target - 0.2) {
        const newProgress = current + (target - current) * 0.05;
        this.progress.set(newProgress);
        rafId = requestAnimationFrame(animateProgress);
      } else {
        // Se alcanzó el 60%, ahora solo esperamos a que la promesa termine.
        this.progress.set(target);
      }
    };

    // Inicia la animación
    rafId = requestAnimationFrame(animateProgress);

    // Cuando la promesa termina, marcamos la bandera.
    // La animación se detendrá y finalizará en el siguiente cuadro.
    promise.finally(() => {
      isPromiseDone = true;
      // Si la animación ya se detuvo en 60, necesitamos llamar a finalise manualmente.
      if (this.progress() === 60) {
        finalise();
      }
    });

    return promise;
  }
}
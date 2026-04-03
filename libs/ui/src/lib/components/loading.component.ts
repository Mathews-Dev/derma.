import { Component, ChangeDetectionStrategy, input, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'ui-loading',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  template: `
    @if (isVisible()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center loading-backdrop"
           [class.animate-loading-backdrop]="!isAnimatingOut()"
           [class.animate-loading-backdrop-exit]="isAnimatingOut()">
        <h1 class="loading-text font-goodly"
            [class.animate-loading-text]="!isAnimatingOut()"
            [class.animate-loading-text-exit]="isAnimatingOut()"
            [style.--fill]="currentProgress() + '%'">
          derma.
        </h1>
        <span class="sr-only">Cargando {{ currentProgress() }} por ciento</span>
      </div>
    }
  `,
  styles: `

    .loading-text {
      font-size: 3rem;
      font-weight: 400;
      letter-spacing: 5px;
      color: rgba(33, 37, 41, 0.15);
      position: relative;
      line-height: 1;
      text-align: center;
      z-index: 10;
    }

    .loading-text::after {
      content: "derma.";
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      font-family: var(--font-goodly);
      color: var(--c-800);
      pointer-events: none;
      
      -webkit-mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1000' height='600' viewBox='0 0 1000 600' preserveAspectRatio='none'%3E%3Cpath d='M 0 300 C 125 260 125 340 250 300 C 375 260 375 340 500 300 C 625 260 625 340 750 300 C 875 260 875 340 1000 300 L 1000 600 L 0 600 Z' fill='%23000'/%3E%3C/svg%3E");
      mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1000' height='600' viewBox='0 0 1000 600' preserveAspectRatio='none'%3E%3Cpath d='M 0 300 C 125 260 125 340 250 300 C 375 260 375 340 500 300 C 625 260 625 340 750 300 C 875 260 875 340 1000 300 L 1000 600 L 0 600 Z' fill='%23000'/%3E%3C/svg%3E");
      
      -webkit-mask-size: 200% 200%;
      mask-size: 200% 200%;
      -webkit-mask-repeat: repeat-x;
      mask-repeat: repeat-x;
      transition: -webkit-mask-position 0.35s ease, mask-position 0.35s ease;

      /* La posición vertical del relleno ahora sigue la variable --fill controlada por progreso */
      -webkit-mask-position-y: var(--fill, 0%);
      mask-position-y: var(--fill, 0%);

      /* Mantiene un flujo horizontal suave opcional */
      animation: aqueous-flow 9s linear infinite;
    }

    @keyframes aqueous-flow {
      from { -webkit-mask-position-x: 0; mask-position-x: 0; }
      to { -webkit-mask-position-x: -100%; mask-position-x: -100%; }
    }

    @keyframes loading-backdrop-enter {
      from {
        opacity: 0;
      }
      to {
        opacity: 1;
      }
    }

    @keyframes loading-text-enter {
      from {
        opacity: 0;
        transform: scale(0.95) translateY(8px);
      }
      to {
        opacity: 1;
        transform: scale(1) translateY(0);
      }
    }

    .animate-loading-backdrop {
      animation: loading-backdrop-enter 0.5s cubic-bezier(0.4, 0, 0.2, 1) forwards;
    }

    .animate-loading-text {
      animation: loading-text-enter 0.7s cubic-bezier(0.34, 1.56, 0.64, 1) 0.1s forwards;
      opacity: 0;
    }

    .loading-backdrop {
      background-color: rgba(78, 62, 118, 0.05) !important;
      backdrop-filter: blur(8px) saturate(150%) !important;
      -webkit-backdrop-filter: blur(8px) saturate(150%) !important;
    }

    @keyframes loading-backdrop-exit {
      from {
        opacity: 1;
      }
      to {
        opacity: 0;
      }
    }

    @keyframes loading-text-exit {
      from {
        opacity: 1;
        transform: scale(1) translateY(0);
      }
      to {
        opacity: 0;
        transform: scale(0.95) translateY(8px);
      }
    }

    .animate-loading-backdrop-exit {
      animation: loading-backdrop-exit 0.4s cubic-bezier(0.4, 0, 0.2, 1) forwards;
    }

    .animate-loading-text-exit {
      animation: loading-text-exit 0.32s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
    }
  `
})
export class LoadingComponent {
  isOpen = input<boolean>(false);
  progress = input<number>(0);
  currentProgress = signal(0);
  isVisible = signal(false);
  isAnimatingOut = signal(false);

  constructor() {
    effect(() => {
      if (this.isOpen()) {
        this.isVisible.set(true);
        this.isAnimatingOut.set(false);
        this.currentProgress.set(clampProgress(this.progress()));
      } else if (this.isVisible()) {
        this.isAnimatingOut.set(true);
        setTimeout(() => this.isVisible.set(false), 500);
      }
    });

    effect(() => {
      this.currentProgress.set(clampProgress(this.progress()));
    });
  }
}

function clampProgress(value: number | null | undefined): number {
  if (typeof value !== 'number' || Number.isNaN(value)) return 0;
  if (value < 0) return 0;
  if (value > 100) return 100;
  return Math.round(value);
}


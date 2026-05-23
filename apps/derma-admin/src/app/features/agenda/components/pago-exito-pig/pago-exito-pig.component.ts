import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  viewChild,
} from '@angular/core';
import type { AnimationItem } from 'lottie-web';

/** Cerdito Lottie (stroke, sin fondo) — system-regular-68-savings-hover-pig. */
@Component({
  selector: 'derm-pago-exito-pig',
  standalone: true,
  template: `<div class="pago-exito__lottie" #host aria-hidden="true"></div>`,
  styleUrl: './pago-exito-pig.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PagoExitoPigComponent implements AfterViewInit, OnDestroy {
  private readonly host = viewChild.required<ElementRef<HTMLElement>>('host');
  private anim: AnimationItem | null = null;

  async ngAfterViewInit(): Promise<void> {
    const lottie = (await import('lottie-web')).default;
    this.anim = lottie.loadAnimation({
      container: this.host().nativeElement,
      renderer: 'svg',
      loop: false,      
      autoplay: true,   
      path: '/assets/animations/system-regular-68-savings-hover-pig.json',
      rendererSettings: {
        preserveAspectRatio: 'xMidYMid meet',
        progressiveLoad: true,
      },
    });
        
    this.anim.addEventListener('complete', () => {
      setTimeout(() => {
        if (this.anim) {
          this.anim.goToAndPlay(0); 
        }
      }, 2000); 
    });
  }

  ngOnDestroy(): void {
    this.anim?.destroy();
    this.anim = null;
  }
}

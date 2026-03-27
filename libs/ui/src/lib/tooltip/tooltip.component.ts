import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  TemplateRef,
  ViewChild,
  ViewContainerRef,
  inject,
  input,
  signal
} from '@angular/core';
import { Overlay, OverlayConfig, OverlayRef, ConnectedPosition } from '@angular/cdk/overlay';
import { TemplatePortal } from '@angular/cdk/portal';

type TooltipPlacement = 'top' | 'right' | 'bottom' | 'left';

@Component({
  selector: 'app-tooltip',
  templateUrl: './tooltip.component.html',
  styleUrl: './tooltip.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TooltipComponent implements OnDestroy {
  readonly text = input('');
  readonly placement = input<TooltipPlacement>('top');
  readonly caption = input('Tip');

  @ViewChild('trigger', { static: true }) private trigger!: ElementRef<HTMLElement>;
  @ViewChild('tooltipPanel', { static: true }) private tooltipPanel!: TemplateRef<unknown>;

  private readonly overlay = inject(Overlay);
  private readonly viewContainerRef = inject(ViewContainerRef);

  protected readonly isOpen = signal(false);
  protected readonly isClosing = signal(false);
  private overlayRef: OverlayRef | null = null;
  private closeTimer: ReturnType<typeof setTimeout> | null = null;

  ngOnDestroy() {
    this.close();
  }

  protected show() {
    if (!this.text().trim() || this.isOpen()) {
      return;
    }

    if (this.closeTimer) {
      clearTimeout(this.closeTimer);
      this.closeTimer = null;
    }

    this.disposeOverlay();

    const positions = this.getPositions(this.placement());
    const positionStrategy = this.overlay
      .position()
      .flexibleConnectedTo(this.trigger)
      .withPositions(positions)
      .withPush(true)
      .withViewportMargin(12);

    const config = new OverlayConfig({
      positionStrategy,
      scrollStrategy: this.overlay.scrollStrategies.reposition(),
      hasBackdrop: false
    });

    this.overlayRef = this.overlay.create(config);
    this.overlayRef.attach(new TemplatePortal(this.tooltipPanel, this.viewContainerRef));
    this.isClosing.set(false);
    this.isOpen.set(true);
  }

  protected hide() {
    this.closeAnimated();
  }

  private close() {
    if (this.closeTimer) {
      clearTimeout(this.closeTimer);
      this.closeTimer = null;
    }
    this.disposeOverlay();
    this.isClosing.set(false);
    this.isOpen.set(false);
  }

  private closeAnimated() {
    if (!this.overlayRef || this.isClosing()) {
      return;
    }

    this.isClosing.set(true);
    this.closeTimer = setTimeout(() => {
      this.disposeOverlay();
      this.isOpen.set(false);
      this.isClosing.set(false);
      this.closeTimer = null;
    }, 120);
  }

  private disposeOverlay() {
    if (!this.overlayRef) {
      return;
    }

    this.overlayRef.detach();
    this.overlayRef.dispose();
    this.overlayRef = null;
  }

  private getPositions(placement: TooltipPlacement): ConnectedPosition[] {
    const map: Record<TooltipPlacement, ConnectedPosition[]> = {
      top: [
        { originX: 'center', originY: 'top', overlayX: 'center', overlayY: 'bottom', offsetY: -8 },
        { originX: 'center', originY: 'bottom', overlayX: 'center', overlayY: 'top', offsetY: 8 }
      ],
      right: [
        { originX: 'end', originY: 'center', overlayX: 'start', overlayY: 'center', offsetX: 8 },
        { originX: 'start', originY: 'center', overlayX: 'end', overlayY: 'center', offsetX: -8 }
      ],
      bottom: [
        { originX: 'center', originY: 'bottom', overlayX: 'center', overlayY: 'top', offsetY: 8 },
        { originX: 'center', originY: 'top', overlayX: 'center', overlayY: 'bottom', offsetY: -8 }
      ],
      left: [
        { originX: 'start', originY: 'center', overlayX: 'end', overlayY: 'center', offsetX: -8 },
        { originX: 'end', originY: 'center', overlayX: 'start', overlayY: 'center', offsetX: 8 }
      ]
    };

    return map[placement];
  }
}

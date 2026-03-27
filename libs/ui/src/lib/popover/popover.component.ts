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
  output,
  signal
} from '@angular/core';
import { Overlay, OverlayConfig, OverlayRef, ConnectedPosition } from '@angular/cdk/overlay';
import { TemplatePortal } from '@angular/cdk/portal';

type PopoverPlacement = 'top' | 'right' | 'bottom' | 'left';

@Component({
  selector: 'app-popover',
  templateUrl: './popover.component.html',
  styleUrl: './popover.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PopoverComponent implements OnDestroy {
  readonly title = input('Información');
  readonly description = input('');
  readonly placement = input<PopoverPlacement>('bottom');
  readonly panelWidth = input(320);

  readonly openChange = output<boolean>();

  @ViewChild('trigger', { static: true }) private trigger!: ElementRef<HTMLElement>;
  @ViewChild('popoverPanel', { static: true }) private popoverPanel!: TemplateRef<unknown>;

  private readonly overlay = inject(Overlay);
  private readonly viewContainerRef = inject(ViewContainerRef);

  protected readonly isOpen = signal(false);
  protected readonly isClosing = signal(false);
  private overlayRef: OverlayRef | null = null;
  private closeTimer: ReturnType<typeof setTimeout> | null = null;

  ngOnDestroy() {
    this.close();
  }

  protected toggle() {
    if (this.isOpen()) {
      this.closeAnimated();
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
      .withViewportMargin(16);

    const config = new OverlayConfig({
      positionStrategy,
      scrollStrategy: this.overlay.scrollStrategies.reposition(),
      hasBackdrop: true,
      backdropClass: 'cdk-overlay-transparent-backdrop',
      width: this.panelWidth()
    });

    this.overlayRef = this.overlay.create(config);
    this.overlayRef.attach(new TemplatePortal(this.popoverPanel, this.viewContainerRef));
    this.overlayRef.backdropClick().subscribe(() => this.closeAnimated());
    this.overlayRef.keydownEvents().subscribe((event) => {
      if (event.key === 'Escape') {
        this.closeAnimated();
      }
    });

    this.isClosing.set(false);
    this.isOpen.set(true);
    this.openChange.emit(true);
  }

  protected close() {
    if (this.closeTimer) {
      clearTimeout(this.closeTimer);
      this.closeTimer = null;
    }

    this.disposeOverlay();
    this.isClosing.set(false);

    if (this.isOpen()) {
      this.isOpen.set(false);
      this.openChange.emit(false);
    }
  }

  protected closeAnimated() {
    if (!this.overlayRef || this.isClosing()) {
      return;
    }

    this.isClosing.set(true);
    this.closeTimer = setTimeout(() => {
      this.disposeOverlay();
      if (this.isOpen()) {
        this.isOpen.set(false);
        this.openChange.emit(false);
      }
      this.isClosing.set(false);
      this.closeTimer = null;
    }, 180);
  }

  private disposeOverlay() {
    if (!this.overlayRef) {
      return;
    }

    this.overlayRef.detach();
    this.overlayRef.dispose();
    this.overlayRef = null;
  }

  private getPositions(placement: PopoverPlacement): ConnectedPosition[] {
    const map: Record<PopoverPlacement, ConnectedPosition[]> = {
      top: [
        { originX: 'center', originY: 'top', overlayX: 'center', overlayY: 'bottom', offsetY: -10 },
        { originX: 'center', originY: 'bottom', overlayX: 'center', overlayY: 'top', offsetY: 10 }
      ],
      right: [
        { originX: 'end', originY: 'center', overlayX: 'start', overlayY: 'center', offsetX: 10 },
        { originX: 'start', originY: 'center', overlayX: 'end', overlayY: 'center', offsetX: -10 }
      ],
      bottom: [
        { originX: 'center', originY: 'bottom', overlayX: 'center', overlayY: 'top', offsetY: 10 },
        { originX: 'center', originY: 'top', overlayX: 'center', overlayY: 'bottom', offsetY: -10 }
      ],
      left: [
        { originX: 'start', originY: 'center', overlayX: 'end', overlayY: 'center', offsetX: -10 },
        { originX: 'end', originY: 'center', overlayX: 'start', overlayY: 'center', offsetX: 10 }
      ]
    };

    return map[placement];
  }
}

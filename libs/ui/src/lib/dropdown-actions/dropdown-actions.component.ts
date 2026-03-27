import {
  Component,
  ChangeDetectionStrategy,
  output,
  signal,
  ViewChild,
  ElementRef,
  TemplateRef,
  inject,
  ViewContainerRef,
  OnDestroy,
  ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Overlay, OverlayRef, OverlayConfig } from '@angular/cdk/overlay';
import { TemplatePortal } from '@angular/cdk/portal';
import { ConnectedPosition } from '@angular/cdk/overlay';

export type ActionType = 'edit' | 'delete' | 'archive';

@Component({
  selector: 'app-dropdown-actions',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dropdown-actions.component.html',
  styleUrl: './dropdown-actions.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DropdownActionsComponent implements OnDestroy {
  @ViewChild('triggerButton') triggerButton!: ElementRef;
  @ViewChild('dropdownMenu') dropdownMenu!: TemplateRef<any>;

  private overlay = inject(Overlay);
  private viewContainerRef = inject(ViewContainerRef);
  private cdr = inject(ChangeDetectorRef);

  isOpen = signal(false);
  actionClicked = output<ActionType>();

  private overlayRef: OverlayRef | null = null;

  ngOnDestroy() {
    this.closeMenu();
  }

  toggleOpen() {
    if (this.isOpen()) {
      this.closeMenu();
    } else {
      this.openMenu();
    }
  }

  private openMenu() {
    if (!this.triggerButton || !this.dropdownMenu) return;

    const positions: ConnectedPosition[] = [
      {
        originX: 'end',
        originY: 'bottom',
        overlayX: 'end',
        overlayY: 'top',
        offsetY: 8
      },
      {
        originX: 'end',
        originY: 'top',
        overlayX: 'end',
        overlayY: 'bottom',
        offsetY: -8
      }
    ];

    const strategy = this.overlay.position()
      .flexibleConnectedTo(this.triggerButton)
      .withPositions(positions)
      .withPush(true)
      .withViewportMargin(16);

    const config = new OverlayConfig({
      positionStrategy: strategy,
      scrollStrategy: this.overlay.scrollStrategies.reposition(),
      hasBackdrop: true,
      backdropClass: 'cdk-overlay-transparent-backdrop',
      width: 180
    });

    this.overlayRef = this.overlay.create(config);

    const portal = new TemplatePortal(
      this.dropdownMenu,
      this.viewContainerRef
    );
    this.overlayRef.attach(portal);

    this.overlayRef.backdropClick().subscribe(() => {
      this.closeMenu();
    });

    this.isOpen.set(true);
    this.cdr.markForCheck();
  }

  private closeMenu() {
    if (this.overlayRef) {
      this.overlayRef.detach();
      this.overlayRef.dispose();
      this.overlayRef = null;
    }
    this.isOpen.set(false);
    this.cdr.markForCheck();
  }

  selectAction(action: ActionType) {
    this.actionClicked.emit(action);
    this.closeMenu();
  }
}


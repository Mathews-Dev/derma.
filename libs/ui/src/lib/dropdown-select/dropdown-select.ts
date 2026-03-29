import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
  signal,
  computed,
  inject,
  ViewContainerRef,
  OnDestroy,
  ViewChild,
  ElementRef,
  TemplateRef,
  ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Overlay, OverlayRef, OverlayConfig } from '@angular/cdk/overlay';
import { TemplatePortal } from '@angular/cdk/portal';
import { ConnectedPosition } from '@angular/cdk/overlay';

export interface SelectOption {
  id: string | number;
  label: string;
}

@Component({
  selector: 'ui-dropdown-select',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dropdown-select.html',
  styleUrl: './dropdown-select.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UiDropdownSelectComponent implements OnDestroy {
  @ViewChild('triggerButton') triggerButton!: ElementRef;
  @ViewChild('dropdownPanel') dropdownPanel!: TemplateRef<unknown>;

  private overlay = inject(Overlay);
  private viewContainerRef = inject(ViewContainerRef);
  private cdr = inject(ChangeDetectorRef);

  options = input.required<SelectOption[]>();
  placeholder = input<string>('Seleccionar...');
  selectedValue = input<string | number | null>(null);

  valueChanged = output<SelectOption>();

  isOpen = signal(false);
  private overlayRef: OverlayRef | null = null;

  selectedOption = computed(() => {
    const val = this.selectedValue();
    return val !== null ? this.options().find((opt) => opt.id === val) : null;
  });

  ngOnDestroy() {
    this.closeDropdown();
  }

  toggleOpen() {
    if (this.isOpen()) {
      this.closeDropdown();
    } else {
      this.openDropdown();
    }
  }

  private openDropdown() {
    if (!this.triggerButton || !this.dropdownPanel) return;

    const positions: ConnectedPosition[] = [
      {
        originX: 'start',
        originY: 'bottom',
        overlayX: 'start',
        overlayY: 'top',
        offsetY: 8
      },
      {
        originX: 'start',
        originY: 'top',
        overlayX: 'start',
        overlayY: 'bottom',
        offsetY: -8
      }
    ];

    const config = new OverlayConfig({
      positionStrategy: this.overlay
        .position()
        .flexibleConnectedTo(this.triggerButton)
        .withPositions(positions),
      backdropClass: '',
      hasBackdrop: true,
      scrollStrategy: this.overlay.scrollStrategies.reposition()
    });

    this.overlayRef = this.overlay.create(config);
    const portal = new TemplatePortal(
      this.dropdownPanel,
      this.viewContainerRef
    );

    this.overlayRef.attach(portal);
    this.isOpen.set(true);

    this.overlayRef.backdropClick().subscribe(() => {
      this.closeDropdown();
    });

    this.cdr.markForCheck();
  }

  private closeDropdown() {
    if (this.overlayRef) {
      this.overlayRef.detach();
      this.overlayRef = null;
    }
    this.isOpen.set(false);
    this.cdr.markForCheck();
  }

  select(option: SelectOption) {
    this.valueChanged.emit(option);
    this.closeDropdown();
  }
}

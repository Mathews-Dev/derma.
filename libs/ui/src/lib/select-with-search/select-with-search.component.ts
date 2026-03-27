import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
  signal,
  computed,
  effect,
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
  selector: 'app-select-with-search',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './select-with-search.component.html',
  styleUrl: './select-with-search.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SelectWithSearchComponent implements OnDestroy {
  @ViewChild('triggerButton') triggerButton!: ElementRef;
  @ViewChild('dropdownPanel') dropdownPanel!: TemplateRef<any>;

  private overlay = inject(Overlay);
  private viewContainerRef = inject(ViewContainerRef);
  private cdr = inject(ChangeDetectorRef);

  options = input.required<SelectOption[]>();
  placeholder = input<string>('Buscar...');
  selectedValue = input<string | number | null>(null);

  valueChanged = output<SelectOption>();

  isOpen = signal(false);
  searchTerm = signal('');
  private overlayRef: OverlayRef | null = null;

  filteredOptions = computed(() => {
    const search = this.searchTerm().toLowerCase();
    return search
      ? this.options().filter((opt) =>
          opt.label.toLowerCase().includes(search)
        )
      : this.options();
  });

  selectedOption = computed(() => {
    const val = this.selectedValue();
    return val !== null ? this.options().find((opt) => opt.id === val) : null;
  });

  constructor() {
    effect(() => {
      if (!this.isOpen()) {
        this.searchTerm.set('');
      }
    });
  }

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

    const strategy = this.overlay.position()
      .flexibleConnectedTo(this.triggerButton)
      .withPositions(positions)
      .withPush(true)
      .withViewportMargin(16);

    const config = new OverlayConfig({
      positionStrategy: strategy,
      scrollStrategy: this.overlay.scrollStrategies.reposition(),
      width: this.triggerButton.nativeElement.offsetWidth,
      minWidth: 200,
      maxHeight: 300,
      backdropClass: 'cdk-overlay-transparent-backdrop',
      hasBackdrop: true
    });

    this.overlayRef = this.overlay.create(config);

    const portal = new TemplatePortal(
      this.dropdownPanel,
      this.viewContainerRef
    );
    this.overlayRef.attach(portal);

    this.overlayRef.backdropClick().subscribe(() => {
      this.closeDropdown();
    });

    this.isOpen.set(true);
    this.cdr.markForCheck();
  }

  private closeDropdown() {
    if (this.overlayRef) {
      this.overlayRef.detach();
      this.overlayRef.dispose();
      this.overlayRef = null;
    }
    this.isOpen.set(false);
    this.cdr.markForCheck();
  }

  select(option: SelectOption) {
    this.valueChanged.emit(option);
    this.closeDropdown();
  }

  onSearchChange(value: string) {
    this.searchTerm.set(value);
  }
}

import {

  ChangeDetectionStrategy,

  ChangeDetectorRef,

  Component,

  ElementRef,

  OnDestroy,

  TemplateRef,

  ViewChild,

  ViewContainerRef,

  computed,

  inject,

  input,

  model,

  output,

  signal,

} from '@angular/core';

import { CommonModule } from '@angular/common';

import { FormsModule } from '@angular/forms';

import type { ConnectedPosition } from '@angular/cdk/overlay';

import { Overlay, OverlayConfig, OverlayRef } from '@angular/cdk/overlay';

import { TemplatePortal } from '@angular/cdk/portal';

import { Subscription } from 'rxjs';



import { PHONE_COUNTRIES, getPhoneCountryByIso, type PhoneCountry } from './phone-countries';

import { formatPhoneNumberByIso, isValidLocalPhone } from './phone-input.utils';



@Component({

  selector: 'ui-phone-input',

  standalone: true,

  imports: [CommonModule, FormsModule],

  templateUrl: './phone-input.component.html',

  styleUrl: './phone-input.component.css',

  changeDetection: ChangeDetectionStrategy.OnPush,

})

export class UiPhoneInputComponent implements OnDestroy {

  label = input<string>('Teléfono');

  showLabel = input(true);

  /** Bloquea país y dígitos (p. ej. número igual al del paciente salvo si se permite personalizar). */

  disabled = input(false);

  placeholder = input('1122334455');

  required = input(false);

  touched = input(false);

  errorMessage = input('Campo requerido');



  countryIso = model<string>('AR');

  localNumber = model<string>('');

  valueChange = output<void>();



  @ViewChild('countryTriggerBtn') private countryTriggerBtn?: ElementRef<HTMLElement>;

  @ViewChild('countryDropdownPanel') private countryDropdownPanel?: TemplateRef<unknown>;



  private readonly overlay = inject(Overlay);

  private readonly viewContainerRef = inject(ViewContainerRef);

  private readonly cdr = inject(ChangeDetectorRef);

  private overlayRef: OverlayRef | null = null;
  private backdropSub?: Subscription;



  /** Sincroniza UI del botón (anillo/chevron); el panel va en overlay CDK. */

  isDropdownOpen = signal(false);

  countries = PHONE_COUNTRIES;



  selectedCountry = computed(() => getPhoneCountryByIso(this.countryIso()));



  formatted = computed(() =>

    formatPhoneNumberByIso(this.countryIso(), this.localNumber())

  );



  showError = computed(

    () =>

      this.touched() &&

      this.required() &&

      !isValidLocalPhone(this.localNumber())

  );



  ngOnDestroy(): void {

    this.closeCountryDropdown();

  }



  toggleDropdown(event: Event): void {

    if (this.disabled()) return;

    event.stopPropagation();

    if (this.isDropdownOpen()) {

      this.closeCountryDropdown();

    } else {

      this.openCountryDropdown();

    }

  }



  selectCountry(country: PhoneCountry): void {

    if (this.disabled()) return;

    this.countryIso.set(country.isoCode);

    this.closeCountryDropdown();

    this.valueChange.emit();

  }



  onLocalChange(value: string): void {

    if (this.disabled()) return;

    this.localNumber.set(value);

    this.valueChange.emit();

  }



  private openCountryDropdown(): void {

    const trigger = this.countryTriggerBtn;

    const panel = this.countryDropdownPanel;

    if (!trigger?.nativeElement || !panel || this.overlayRef) return;



    const w = trigger.nativeElement.getBoundingClientRect().width;

    const width = Math.max(Math.round(w), 140);



    const positions: ConnectedPosition[] = [

      {

        originX: 'start',

        originY: 'bottom',

        overlayX: 'start',

        overlayY: 'top',

        offsetY: 6,

      },

      {

        originX: 'start',

        originY: 'top',

        overlayX: 'start',

        overlayY: 'bottom',

        offsetY: -6,

      },

    ];



    const positionStrategy = this.overlay

      .position()

      .flexibleConnectedTo(trigger)

      .withPositions(positions)

      .withPush(true)

      .withViewportMargin(12);



    const config = new OverlayConfig({

      positionStrategy,

      scrollStrategy: this.overlay.scrollStrategies.reposition(),

      width,

      minWidth: width,

      maxHeight: 280,

      hasBackdrop: true,

      backdropClass: 'cdk-overlay-transparent-backdrop',

    });



    this.overlayRef = this.overlay.create(config);

    this.overlayRef.attach(new TemplatePortal(panel, this.viewContainerRef));



    this.backdropSub?.unsubscribe();

    this.backdropSub = this.overlayRef.backdropClick().subscribe(() =>

      this.closeCountryDropdown(),

    );



    this.isDropdownOpen.set(true);

    this.cdr.markForCheck();

  }



  private closeCountryDropdown(): void {

    this.backdropSub?.unsubscribe();

    this.backdropSub = undefined;

    if (!this.overlayRef) {

      this.isDropdownOpen.set(false);

      return;

    }



    this.overlayRef.detach();

    this.overlayRef.dispose();

    this.overlayRef = null;

    this.isDropdownOpen.set(false);

    this.cdr.markForCheck();

  }

}



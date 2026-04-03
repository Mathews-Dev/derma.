import { Component, ChangeDetectionStrategy, inject, input, output } from '@angular/core';
import { DOCUMENT } from '@angular/common';

@Component({
  selector: 'ui-sticky-footer',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `:host { display: contents; }`,
  template: `
    <div
      class="fixed bottom-0 left-0 right-0 z-40 transition-all duration-500 ease-in-out"
      [class.lg:left-[240px]]="!isSidebarCollapsed()"
      [class.lg:left-[72px]]="isSidebarCollapsed()">
      <div class="bg-[var(--c-50)]/95 backdrop-blur-sm border-t border-[var(--c-200)] shadow-[0_-4px_24px_rgba(0,0,0,0.06)]">
        <div class="px-5 lg:px-10 py-3.5 flex items-center justify-between gap-4">

          <!-- Indicador de estado / hint -->
          @if (isDirty() !== null) {
            <div class="flex items-center gap-2">
              @if (isDirty()) {
                <span class="size-1.5 rounded-full bg-amber-400 animate-pulse shrink-0"></span>
                <span class="text-[11px] font-medium text-[var(--c-600)] uppercase tracking-wider">Cambios sin guardar</span>
              } @else {
                <span class="size-1.5 rounded-full bg-[var(--c-300)] shrink-0"></span>
                <span class="text-[11px] text-[var(--c-400)] uppercase tracking-wider">Sin cambios</span>
              }
            </div>
          } @else {
            <p class="text-[11px] text-[var(--c-400)]">
              @if (isSubmitting()) {
                Guardando cambios...
              } @else {
                Los cambios locales no se guardan hasta hacer clic en "Guardar".
              }
            </p>
          }

          <!-- Botones de acción -->
          <div class="flex items-center gap-3">

            @if (showCancel()) {
              <button
                type="button"
                (click)="cancelClick.emit()"
                class="px-5 py-2.5 rounded-full border border-[var(--c-300)] text-[var(--c-600)] text-[12px] font-medium hover:border-[var(--c-800)] hover:text-[var(--c-800)] transition-all tracking-wide">
                Cancelar
              </button>
            }

            @if (secondaryLabel()) {
              <button
                type="button"
                (click)="secondaryClick.emit()"
                [disabled]="isSubmitting()"
                class="px-5 py-2.5 rounded-full border border-[var(--c-300)] text-[var(--c-600)] text-[12px] font-medium hover:border-[var(--c-800)] hover:text-[var(--c-800)] transition-all disabled:opacity-50 tracking-wide">
                {{ secondaryLabel() }}
              </button>
            }

            <button
              type="button"
              (click)="submitForm()"
              [disabled]="submitDisabled() || isSubmitting()"
              class="px-6 py-2.5 rounded-full bg-[var(--c-800)] text-[var(--c-50)] text-[12px] font-medium hover:bg-[var(--c-700)] transition-all disabled:opacity-50 tracking-wide flex items-center gap-2">
              @if (isSubmitting()) {
                <svg class="size-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                </svg>
              }
              {{ isSubmitting() ? 'Guardando...' : submitLabel() }}
            </button>

          </div>
        </div>
      </div>
    </div>
  `,
})
export class UiStickyFooterComponent {
  /** ID del <form> al que pertenece el botón de submit */
  formId = input.required<string>();

  /** Muestra spinner y desactiva botones mientras se guarda */
  isSubmitting = input<boolean>(false);

  /**
   * Estado dirty reactivo:
   * - `null`  → muestra el hint estático "Los cambios locales no se guardan..."
   * - `true`  → muestra dot ámbar + "Cambios sin guardar"
   * - `false` → muestra dot gris + "Sin cambios"
   */
  isDirty = input<boolean | null>(null);

  /** Texto del botón de acción principal */
  submitLabel = input<string>('Guardar cambios');

  /** Deshabilita el botón submit (además de `isSubmitting`) */
  submitDisabled = input<boolean>(false);

  /** Offset lateral que respeta el ancho del sidebar colapsado/expandido */
  isSidebarCollapsed = input<boolean>(false);

  /** Muestra el botón "Cancelar" a la izquierda de las acciones */
  showCancel = input<boolean>(false);

  /**
   * Label del botón secundario opcional (ej. "Guardar como borrador").
   * Si es `null` o vacío, el botón no se renderiza.
   */
  secondaryLabel = input<string | null>(null);

  /** Emite cuando el usuario hace clic en "Cancelar" */
  cancelClick = output<void>();

  /** Emite cuando el usuario hace clic en el botón secundario */
  secondaryClick = output<void>();

  private readonly document = inject(DOCUMENT);

  submitForm(): void {
    const form = this.document.getElementById(this.formId());
    if (form instanceof HTMLFormElement) {
      form.requestSubmit();
    }
  }
}

import { Component, input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, ReactiveFormsModule, FormControl } from '@angular/forms';

@Component({
  selector: 'ui-input',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="space-y-[6px]">
      <label [for]="id()" class="text-[10px] uppercase font-medium text-[var(--c-600)] block tracking-widest ml-1">
        {{ label() }}
      </label>
      <input 
        [id]="id()" 
        [type]="type()" 
        [placeholder]="placeholder()" 
        [formControl]="formControl"
        [autocomplete]="autocomplete()"
        class="w-full h-[44px] bg-[var(--c-50)] outline-none border border-[var(--c-200)] hover:border-[var(--c-400)] focus:bg-[var(--c-50)] focus:border-[var(--c-800)] focus:ring-1 focus:ring-[var(--c-800)] transition-all duration-200 ease-out rounded-xl px-4 text-[0.875rem] text-[var(--c-800)] placeholder:text-[var(--c-400)]"
      >
      @if (formControl.touched && formControl.invalid) {
        <div class="mt-1 ml-1 flex flex-col gap-0.5">
          @if (formControl.errors?.['required']) {
            <p class="text-[9px] text-red-500 font-medium">Requerido</p>
          }
          @if (formControl.errors?.['email']) {
            <p class="text-[9px] text-red-500 font-medium">Debe ser un correo válido</p>
          }
          @if (formControl.errors?.['minlength']) {
            <p class="text-[9px] text-red-500 font-medium">MÃnimo {{ formControl.errors?.['minlength']?.requiredLength }} caracteres</p>
          }
        </div>
      }
    </div>
  `,
  styles: `
    :host {
      display: block;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UiInputComponent {
  label = input.required<string>();
  type = input<string>('text');
  placeholder = input<string>('');
  autocomplete = input<string>('');
  control = input.required<AbstractControl | null>();
  id = input<string>(`ui-input-${Math.random().toString(36).substring(2, 9)}`);

  get formControl(): FormControl {
    return this.control() as FormControl;
  }
}

import { Injectable, signal } from '@angular/core';

export type ToastVariant = 'default' | 'success' | 'error' | 'warning';

export interface Toast {
  id: string;
  message: string;
  variant: ToastVariant;
  duration?: number;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private toasts = signal<Toast[]>([]);
  readonly toasts$ = this.toasts.asReadonly();
  private nextId = 0;

  show(message: string, variant: ToastVariant = 'default', duration = 3000) {
    const id = `toast-${this.nextId++}`;
    const toast: Toast = { id, message, variant, duration };

    this.toasts.update(list => [...list, toast]);

    if (duration > 0) {
      setTimeout(() => this.remove(id), duration);
    }

    return id;
  }

  success(message: string, duration = 3000) {
    return this.show(message, 'success', duration);
  }

  error(message: string, duration = 3000) {
    return this.show(message, 'error', duration);
  }

  warning(message: string, duration = 3000) {
    return this.show(message, 'warning', duration);
  }

  info(message: string, duration = 3000) {
    return this.show(message, 'default', duration);
  }

  remove(id: string) {
    this.toasts.update(list => list.filter(t => t.id !== id));
  }
}

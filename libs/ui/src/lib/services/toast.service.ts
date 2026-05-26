import { Injectable, signal } from '@angular/core';

export type ToastVariant = 'default' | 'success' | 'error' | 'warning';

/** 0 = persistente hasta cerrar. Usar TOAST_DURATION para auto-cierre largo. */
export const TOAST_DURATION = {
  persistent: 0,
  twoMinutes: 120_000,
  fiveMinutes: 300_000,
} as const;

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface ToastOptions {
  title?: string;
  message: string;
  variant?: ToastVariant;
  /** 0 = persistente (default). */
  duration?: number;
  action?: ToastAction;
}

export interface Toast {
  id: string;
  title: string;
  message: string;
  variant: ToastVariant;
  duration: number;
  action?: ToastAction;
  /** Timestamp cuando se programó auto-dismiss (para barra de progreso). */
  dismissAt?: number;
}

const MAX_TOASTS = 5;

const VARIANT_LABEL: Record<ToastVariant, string> = {
  default: 'Información',
  success: 'Éxito',
  error: 'Error',
  warning: 'Advertencia',
};

@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly toasts = signal<Toast[]>([]);
  readonly toasts$ = this.toasts.asReadonly();
  private nextId = 0;
  private readonly timers = new Map<string, ReturnType<typeof setTimeout>>();
  private readonly timerStartedAt = new Map<string, number>();
  private readonly timerRemaining = new Map<string, number>();

  /**
   * Muestra un toast. Por defecto es persistente hasta que el usuario cierre.
   * Para auto-cierre: `duration: TOAST_DURATION.twoMinutes`.
   */
  show(message: string, variant?: ToastVariant, duration?: number): string;
  show(options: ToastOptions): string;
  show(
    messageOrOptions: string | ToastOptions,
    variant: ToastVariant = 'default',
    duration = TOAST_DURATION.persistent,
  ): string {
    const opts = this.normalizeInput(messageOrOptions, variant, duration);
    return this.addToast(opts);
  }

  success(message: string, duration?: number): string;
  success(options: ToastOptions): string;
  success(messageOrOptions: string | ToastOptions, duration = TOAST_DURATION.persistent): string {
    return typeof messageOrOptions === 'string'
      ? this.show(messageOrOptions, 'success', duration)
      : this.show({ ...messageOrOptions, variant: 'success' });
  }

  error(message: string, duration?: number): string;
  error(options: ToastOptions): string;
  error(messageOrOptions: string | ToastOptions, duration = TOAST_DURATION.persistent): string {
    return typeof messageOrOptions === 'string'
      ? this.show(messageOrOptions, 'error', duration)
      : this.show({ ...messageOrOptions, variant: 'error' });
  }

  warning(message: string, duration?: number): string;
  warning(options: ToastOptions): string;
  warning(messageOrOptions: string | ToastOptions, duration = TOAST_DURATION.persistent): string {
    return typeof messageOrOptions === 'string'
      ? this.show(messageOrOptions, 'warning', duration)
      : this.show({ ...messageOrOptions, variant: 'warning' });
  }

  info(message: string, duration?: number): string;
  info(options: ToastOptions): string;
  info(messageOrOptions: string | ToastOptions, duration = TOAST_DURATION.persistent): string {
    return typeof messageOrOptions === 'string'
      ? this.show(messageOrOptions, 'default', duration)
      : this.show({ ...messageOrOptions, variant: 'default' });
  }

  /** Título y cuerpo separados (reemplaza `` `${titulo} — ${mensaje}` ``). */
  showFromParts(
    title: string,
    message: string,
    variant: ToastVariant = 'default',
    duration = TOAST_DURATION.persistent,
  ): string {
    return this.show({ title, message, variant, duration });
  }

  dismissAll(): void {
    for (const id of [...this.timers.keys()]) {
      this.clearTimer(id);
    }
    this.toasts.set([]);
  }

  remove(id: string): void {
    this.clearTimer(id);
    this.toasts.update(list => list.filter(t => t.id !== id));
  }

  /** Pausa el auto-dismiss (hover). */
  pauseTimer(id: string): void {
    const timeout = this.timers.get(id);
    if (!timeout) return;
    clearTimeout(timeout);
    this.timers.delete(id);
    const started = this.timerStartedAt.get(id);
    const remaining = this.timerRemaining.get(id);
    if (started != null && remaining != null) {
      const elapsed = Date.now() - started;
      this.timerRemaining.set(id, Math.max(0, remaining - elapsed));
    }
  }

  /** Reanuda el auto-dismiss tras hover. */
  resumeTimer(id: string): void {
    const toast = this.toasts().find(t => t.id === id);
    const remaining = this.timerRemaining.get(id);
    if (!toast || toast.duration <= 0 || remaining == null || remaining <= 0) return;
    this.scheduleDismiss(id, remaining);
  }

  getVariantLabel(variant: ToastVariant): string {
    return VARIANT_LABEL[variant];
  }

  private normalizeInput(
    messageOrOptions: string | ToastOptions,
    variant: ToastVariant,
    duration: number,
  ): ToastOptions {
    if (typeof messageOrOptions === 'string') {
      return { message: messageOrOptions, variant, duration };
    }
    return {
      variant: messageOrOptions.variant ?? 'default',
      duration: messageOrOptions.duration ?? TOAST_DURATION.persistent,
      ...messageOrOptions,
    };
  }

  private resolveTitleAndBody(
    opts: ToastOptions,
    variant: ToastVariant,
  ): { title: string; message: string } {
    if (opts.title?.trim()) {
      return { title: opts.title.trim(), message: opts.message };
    }
    if (opts.message.length <= 80) {
      return { title: opts.message, message: '' };
    }
    return { title: VARIANT_LABEL[variant], message: opts.message };
  }

  private addToast(opts: ToastOptions): string {
    const id = `toast-${this.nextId++}`;
    const variant = opts.variant ?? 'default';
    const duration = opts.duration ?? TOAST_DURATION.persistent;
    const { title, message } = this.resolveTitleAndBody(opts, variant);

    const toast: Toast = {
      id,
      title,
      message,
      variant,
      duration,
      action: opts.action,
      dismissAt: duration > 0 ? Date.now() + duration : undefined,
    };

    this.toasts.update(list => {
      const next = [...list, toast];
      while (next.length > MAX_TOASTS) {
        const removed = next.shift();
        if (removed) this.clearTimer(removed.id);
      }
      return next;
    });

    if (duration > 0) {
      this.timerRemaining.set(id, duration);
      this.scheduleDismiss(id, duration);
    }

    return id;
  }

  private scheduleDismiss(id: string, ms: number): void {
    this.clearTimer(id);
    this.timerStartedAt.set(id, Date.now());
    this.timerRemaining.set(id, ms);
    const timeout = setTimeout(() => this.remove(id), ms);
    this.timers.set(id, timeout);
    const toast = this.toasts().find(t => t.id === id);
    if (toast && ms > 0) {
      this.toasts.update(list =>
        list.map(t => (t.id === id ? { ...t, dismissAt: Date.now() + ms } : t)),
      );
    }
  }

  private clearTimer(id: string): void {
    const timeout = this.timers.get(id);
    if (timeout) clearTimeout(timeout);
    this.timers.delete(id);
    this.timerStartedAt.delete(id);
    this.timerRemaining.delete(id);
  }
}

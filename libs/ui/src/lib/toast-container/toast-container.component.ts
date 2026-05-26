import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  Toast,
  ToastService,
  ToastVariant,
} from '../services/toast.service';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './toast-container.component.html',
  styleUrl: './toast-container.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToastContainerComponent {
  private readonly toastService = inject(ToastService);
  readonly toasts = this.toastService.toasts$;
  readonly closingIds = signal(new Set<string>());

  showDismissAll(): boolean {
    return this.toasts().length > 2;
  }

  variantBadge(variant: ToastVariant): string {
    return this.toastService.getVariantLabel(variant);
  }

  progressDurationMs(toast: Toast): number | null {
    return toast.duration > 0 ? toast.duration : null;
  }

  dismissAll(): void {
    this.toastService.dismissAll();
    this.closingIds.set(new Set());
  }

  removeToast(id: string): void {
    this.closingIds.update(set => new Set(set).add(id));
    setTimeout(() => {
      this.toastService.remove(id);
      this.closingIds.update(set => {
        const next = new Set(set);
        next.delete(id);
        return next;
      });
    }, 150);
  }

  onToastEnter(id: string): void {
    this.toastService.pauseTimer(id);
  }

  onToastLeave(id: string): void {
    this.toastService.resumeTimer(id);
  }

  runAction(toast: Toast, event: Event): void {
    event.stopPropagation();
    toast.action?.onClick();
    this.removeToast(toast.id);
  }
}

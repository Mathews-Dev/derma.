import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '../services/toast.service';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './toast-container.component.html',
  styleUrl: './toast-container.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ToastContainerComponent {
  private toastService = inject(ToastService);
  toasts = this.toastService.toasts$;

  getAccentColor(variant: string): string {
    switch (variant) {
      case 'success':
        return '#2d6a4f';
      case 'error':
        return '#c0392b';
      case 'warning':
        return '#b5830a';
      default:
        return 'var(--c-800)';
    }
  }

  removeToast(id: string) {
    this.toastService.remove(id);
  }
}

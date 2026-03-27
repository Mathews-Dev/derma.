import { Component, input, output, signal, OnChanges, inject, PLATFORM_ID, ChangeDetectionStrategy } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-delete-profile-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './delete-profile-modal.component.html',
  styleUrl: './delete-profile-modal.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DeleteProfileModalComponent implements OnChanges {
  isOpen = input<boolean>(false);
  profileName = input<string>('');

  confirmed = output<void>();

  private platformId = inject(PLATFORM_ID);
  private isOpenSignal = signal(false);

  ngOnChanges() {
    this.isOpenSignal.set(this.isOpen());

    if (this.isOpen() && isPlatformBrowser(this.platformId)) {
      document.body.style.overflow = 'hidden';
    } else if (isPlatformBrowser(this.platformId)) {
      document.body.style.overflow = 'auto';
    }
  }

  onConfirm() {
    this.confirmed.emit();
    this.isOpenSignal.set(false);
  }

  onCancel() {
    this.isOpenSignal.set(false);
  }

  protected isOpenSignalValue = this.isOpenSignal;
}

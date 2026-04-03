import { Component, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { LoadingService, LoadingComponent, ToastContainerComponent } from '@derma/ui';
import { CommonModule } from '@angular/common';

@Component({
  standalone: true,
  imports: [CommonModule, RouterModule, LoadingComponent, ToastContainerComponent],
  selector: 'derm-root',
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected title = 'derma-admin';
  loadingService = inject(LoadingService);
  isLoading = this.loadingService.isVisible;
  loadingProgress = this.loadingService.progress;
}

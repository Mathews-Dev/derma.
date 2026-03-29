import { Component, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { RegisterStaffComponent } from "./features/auth/register-staff/register-staff.component";
import { LoadingService, LoadingComponent } from '@derma/ui';
import { CommonModule } from '@angular/common';

@Component({
  standalone: true,
  imports: [CommonModule, RouterModule, RegisterStaffComponent, LoadingComponent],
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

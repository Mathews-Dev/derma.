import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { LoadingService, LoadingComponent, ToastContainerComponent } from '@derma/ui';
import { AuthService } from '@derma/firebase';

@Component({
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterModule, LoadingComponent, ToastContainerComponent],
  selector: 'derm-root',
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  private loadingService = inject(LoadingService);
  private authService = inject(AuthService);

  protected isLoading = this.loadingService.isVisible;
  protected loadingProgress = this.loadingService.progress;

  constructor() {
    // Drive the global loading screen through LoadingService so the full
    // RAF-animated progress bar (0 → 60 → 100%) plays while Firebase
    // resolves the persisted session on startup.
    this.loadingService.showWhile(this.authService.authLoaded);
  }
}

import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class LayoutStateService {
  private readonly _isCollapsed = signal(false);
  readonly isSidebarCollapsed = this._isCollapsed.asReadonly();

  setCollapsed(value: boolean): void {
    this._isCollapsed.set(value);
  }

  toggle(): void {
    this._isCollapsed.update(v => !v);
  }
}

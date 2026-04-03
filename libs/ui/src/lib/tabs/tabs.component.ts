import {
  ChangeDetectionStrategy,
  Component,
  input,
  model,
} from '@angular/core';

export type VerticalTabIcon =
  | 'user'
  | 'phone'
  | 'shield'
  | 'briefcase'
  | 'calendar'
  | 'lock'
  | 'mail'
  | 'file'
  | 'tag'
  | 'image'
  | 'globe'
  | 'list'
  | 'users';

export interface VerticalTabItem {
  id: string;
  label: string;
  icon?: VerticalTabIcon;
  /** Muestra un punto ámbar (ej. "cambios sin guardar") */
  badge?: boolean;
}

@Component({
  selector: 'ui-vertical-tabs',
  standalone: true,
  templateUrl: './tabs.component.html',
  styleUrl: './tabs.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UiVerticalTabsComponent {
  tabs   = input.required<VerticalTabItem[]>();
  /** Valor del tab activo — soporta two-way binding: [(active)]="mySignal" */
  active = model<string>('');
}


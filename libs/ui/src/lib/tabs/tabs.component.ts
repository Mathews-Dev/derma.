import { Component, input, signal, AfterViewInit, ViewChildren, QueryList, ElementRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface TabItem {
  id: string;
  label: string;
  content: string;
}

@Component({
  selector: 'app-tabs',
  templateUrl: './tabs.component.html',
  styleUrl: './tabs.component.css',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TabsComponent implements AfterViewInit {
  tabs = input<TabItem[]>([]);
  activeTab = signal<string>(this.tabs()[0]?.id || '');

  @ViewChildren('tabButton') tabButtons!: QueryList<ElementRef>;

  ngAfterViewInit() {
    // Inicialización si es necesaria
  }

  selectTab(tabId: string) {
    this.activeTab.set(tabId);
  }

  private updateIndicator() {
    // La barra ahora se mantiene dentro de cada botón, sin movimiento global
  }
}



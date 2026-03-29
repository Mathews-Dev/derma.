import { Component, input, output, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'ui-pagination',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-6 bg-[var(--c-50)]/50 border-t border-[var(--c-100)] rounded-b-[24px]">
      
      <p class="text-[12px] font-normal text-[var(--c-500)]">
        Mostrando <span class="font-medium text-[var(--c-800)] px-0.5">{{ startItem() }}-{{ endItem() }}</span> de <span class="font-medium text-[var(--c-800)] px-0.5">{{ totalItems() }}</span> resultados
      </p>

      <div class="flex items-center gap-1.5">
        <!-- Botón Anterior -->
        <button 
          (click)="previousPage()" 
          [disabled]="currentPage() === 1 || totalItems() === 0"
          class="size-8 inline-flex items-center justify-center rounded-md border border-[var(--c-200)] bg-[var(--c-50)] text-[var(--c-600)] hover:bg-[var(--c-100)] hover:border-[var(--c-300)] hover:text-[var(--c-800)] transition-all duration-200 disabled:opacity-30 disabled:pointer-events-none group shadow-sm">
          <svg class="size-4 group-hover:-translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/></svg>
        </button>
        
        <!-- Indicadores Numéricos -->
        <div class="flex items-center gap-1 px-2">
          @for (page of pages(); track page) {
            <button 
              (click)="goToPage(page)"
              [class]="page === currentPage() ? 'bg-[var(--c-800)] text-[var(--c-50)]' : 'text-[var(--c-600)] hover:bg-[var(--c-100)]'"
              class="size-8 inline-flex items-center justify-center rounded-md text-[12px] font-medium shadow-sm transition-colors">
              {{ page }}
            </button>
          }
        </div>

        <!-- Botón Siguiente -->
        <button 
          (click)="nextPage()" 
          [disabled]="currentPage() === totalPages() || totalItems() === 0"
          class="size-8 inline-flex items-center justify-center rounded-md border border-[var(--c-200)] bg-[var(--c-50)] text-[var(--c-600)] hover:bg-[var(--c-100)] hover:border-[var(--c-300)] hover:text-[var(--c-800)] transition-all duration-200 disabled:opacity-30 disabled:pointer-events-none group shadow-sm">
          <svg class="size-4 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/></svg>
        </button>
      </div>

    </div>
  `,
  styles: `
    :host {
      display: block;
    }
  `
})
export class UiPaginationComponent {
  totalItems = input.required<number>();
  pageSize = input<number>(10);
  currentPage = input<number>(1);
  
  pageChange = output<number>();

  totalPages = computed(() => {
    const total = Math.ceil(this.totalItems() / this.pageSize());
    return total > 0 ? total : 1;
  });
  
  startItem = computed(() => {
    if (this.totalItems() === 0) return 0;
    return (this.currentPage() - 1) * this.pageSize() + 1;
  });
  
  endItem = computed(() => {
    const end = this.currentPage() * this.pageSize();
    return end > this.totalItems() ? this.totalItems() : end;
  });

  pages = computed(() => {
    const total = this.totalPages();
    const current = this.currentPage();
    const pagesArray: number[] = [];
    
    if (total <= 5) {
      for (let i = 1; i <= total; i++) pagesArray.push(i);
    } else {
      if (current <= 3) {
        pagesArray.push(1, 2, 3, 4, 5);
      } else if (current >= total - 2) {
        pagesArray.push(total - 4, total - 3, total - 2, total - 1, total);
      } else {
        pagesArray.push(current - 2, current - 1, current, current + 1, current + 2);
      }
    }
    return pagesArray;
  });

  previousPage() {
    if (this.currentPage() > 1) {
      this.pageChange.emit(this.currentPage() - 1);
    }
  }

  nextPage() {
    if (this.currentPage() < this.totalPages()) {
      this.pageChange.emit(this.currentPage() + 1);
    }
  }
  
  goToPage(page: number) {
    if (page !== this.currentPage()) {
      this.pageChange.emit(page);
    }
  }
}

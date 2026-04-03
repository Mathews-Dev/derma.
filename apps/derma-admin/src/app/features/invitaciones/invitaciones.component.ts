import { Component, inject, signal, computed, OnInit, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FirestoreService } from '@derma/firebase';
import { Invitacion } from '@derma/models';
import { LoadingComponent, UiButtonComponent, UiPaginationComponent, TooltipComponent, UiPageHeaderComponent, UiLoaderCardComponent, UiBadgeComponent, UiEmptyStateComponent } from '@derma/ui';
import { InvitationModalComponent } from '../../shared/components/invitation-modal/invitation-modal.component';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'derma-admin-invitaciones',
  standalone: true,
  imports: [CommonModule, UiButtonComponent, LoadingComponent, InvitationModalComponent, UiPaginationComponent, TooltipComponent, UiPageHeaderComponent, UiLoaderCardComponent, UiBadgeComponent, UiEmptyStateComponent],
  templateUrl: './invitaciones.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InvitacionesComponent implements OnInit, OnDestroy {
  private firestoreService = inject(FirestoreService);
  private destroy$ = new Subject<void>();

  isModalOpen = signal(false);
  isLoading = signal(true);
  
  allInvitaciones = signal<Invitacion[]>([]);
  now = new Date();

  // Pagination state
  currentPage = signal(1);
  pageSize = signal(10);

  // Computed data
  totalInvitaciones = computed(() => this.allInvitaciones().length);
  
  paginatedInvitaciones = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize();
    const end = start + this.pageSize();
    return this.allInvitaciones().slice(start, end);
  });

  ngOnInit() {
    this.loadInvitaciones();
  }

  loadInvitaciones() {
    this.isLoading.set(true);
    this.firestoreService.getCollection<Invitacion>('invitaciones')
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          const sorted = (data || []).sort((a, b) => {
            const dateA = a.fechaCreacion?.toDate()?.getTime() || 0;
            const dateB = b.fechaCreacion?.toDate()?.getTime() || 0;
            return dateB - dateA; // Descending: newest first
          });
          this.allInvitaciones.set(sorted);
          this.isLoading.set(false);
        },
        error: (err) => {
          console.error('Error fetching invitaciones', err);
          this.isLoading.set(false);
        }
      });
  }

  onPageChange(page: number) {
    this.currentPage.set(page);
  }

  openModal() {
    this.isModalOpen.set(true);
  }

  closeModal() {
    this.isModalOpen.set(false);
  }

  copyLink(url: string | undefined) {
    if (!url) return;
    navigator.clipboard.writeText(url).then(() => {
      // Future: add simple toast toastService.success('URL copiada')
      console.log('Copiado al portapapeles');
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}

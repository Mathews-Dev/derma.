import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { map } from 'rxjs';
import { UiBadgeComponent, CheckboxComponent, ToastService } from '@derma/ui';
import { videoconsultaMockPorId, type VideoconsultaDetalle } from '../../videoconsulta-mock';

@Component({
  selector: 'derm-videoconsulta-detalle',
  standalone: true,
  imports: [CommonModule, RouterLink, UiBadgeComponent, CheckboxComponent],
  templateUrl: './videoconsulta-detalle.component.html',
  styleUrl: './videoconsulta-detalle.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VideoconsultaDetalleComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  private readonly id = toSignal(
    this.route.paramMap.pipe(map(p => p.get('id') ?? '')),
    { initialValue: this.route.snapshot.paramMap.get('id') ?? '' },
  );

  readonly item = computed<VideoconsultaDetalle | undefined>(() => {
    const id = this.id();
    return id ? videoconsultaMockPorId(id) : undefined;
  });

  readonly otroNumPaciente = signal(false);
  readonly otroNumProfesional = signal(false);

  volver(): void {
    void this.router.navigate(['/admin/videoconsultas']);
  }

  async copiarLink(): Promise<void> {
    const url = this.item()?.linkMeet ?? '';
    if (!url) {
      this.toast.warning('Todavía no hay enlace de reunión');
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      this.toast.success('Enlace copiado');
    } catch {
      this.toast.error('No se pudo copiar');
    }
  }

  abrirMeet(): void {
    const url = this.item()?.linkMeet ?? '';
    if (!url) return;
    window.open(url, '_blank', 'noopener,noreferrer');
  }
}

import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UiButtonComponent } from '@derma/ui';
import type { VideoconsultaLinkEstado } from '../../models/videoconsulta.view-model';

@Component({
  selector: 'derm-videoconsulta-meet-panel',
  standalone: true,
  imports: [CommonModule, UiButtonComponent],
  templateUrl: './videoconsulta-meet-panel.component.html',
  styleUrl: './videoconsulta-meet-panel.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VideoconsultaMeetPanelComponent {
  linkMeet = input<string>('');
  linkEstado = input<VideoconsultaLinkEstado>('sin_crear');
  generating = input(false);
  calendarBaseOk = input(true);

  copiar = output<void>();
  abrirMeet = output<void>();
  generarMeet = output<void>();
  conectarGoogle = output<void>();

  readonly puedeGenerar = computed(() => {
    if (!this.calendarBaseOk()) {
      return false;
    }
    const s = this.linkEstado();
    if (s === 'listo' && this.linkMeet().trim()) {
      return false;
    }
    return s === 'sin_crear' || s === 'pendiente' || !this.linkMeet().trim();
  });
}

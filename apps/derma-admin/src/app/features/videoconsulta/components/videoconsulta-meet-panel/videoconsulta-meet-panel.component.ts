import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UiButtonComponent, ToggleComponent } from '@derma/ui';
import type { VideoconsultaLinkEstado } from '../../models/videoconsulta.view-model';

@Component({
  selector: 'derm-videoconsulta-meet-panel',
  standalone: true,
  imports: [CommonModule, UiButtonComponent, ToggleComponent],
  templateUrl: './videoconsulta-meet-panel.component.html',
  styleUrl: './videoconsulta-meet-panel.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VideoconsultaMeetPanelComponent {
  linkMeet = input<string>('');
  linkEstado = input<VideoconsultaLinkEstado>('sin_crear');
  generating = input(false);
  calendarBaseOk = input(true);
  /** Si el profesional ya vinculó Google Calendar (oculta botón conectar). */
  googleConectado = input(false);

  copiar = output<void>();
  abrirMeet = output<void>();
  /** `true` = enviar link por WhatsApp al generar Meet. */
  generarMeet = output<boolean>();
  conectarGoogle = output<void>();

  readonly enviarWhatsapp = signal(true);

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

  onGenerarMeet(): void {
    this.generarMeet.emit(this.enviarWhatsapp());
  }
}

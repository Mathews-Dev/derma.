import { ChangeDetectionStrategy, Component, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Turno, EstadoTurno } from '@derma/models';

@Component({
  selector: 'ui-turno-block',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './turno-block.component.html',
  styleUrl: './turno-block.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TurnoBlockComponent {
  turno = input.required<Turno>();
  top = input<number>(0);
  height = input<number>(0);
  left = input<string>('0%');
  width = input<string>('100%');
  isDragging = input<boolean>(false);

  statusColor = computed(() => {
    const status = this.turno().estado;
    switch (status) {
      case EstadoTurno.CONFIRMADO: return '#3d7a54';
      case EstadoTurno.ATENDIDO: return '#605090';
      case EstadoTurno.CANCELADO: return '#8c4444';
      case EstadoTurno.REPROGRAMADO: return '#9e8530';
      default: return '#9e8530'; // Pendiente
    }
  });

  displayDoctor = computed(() => this.height() > 32);
  displayType = computed(() => this.height() > 48);
}

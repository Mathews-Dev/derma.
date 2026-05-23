import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import type { VideoconsultaNotificacionItem } from '../../models/videoconsulta.view-model';

@Component({
  selector: 'derm-videoconsulta-timeline',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './videoconsulta-timeline.component.html',
  styleUrl: './videoconsulta-timeline.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VideoconsultaTimelineComponent {
  items = input<VideoconsultaNotificacionItem[]>([]);
}

import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
} from '@angular/core';
import { EstadoTarea, PrioridadTarea, Tarea } from '@derma/models';
import { TooltipComponent } from '@derma/ui';

@Component({
  selector: 'app-tarea-card',
  standalone: true,
  imports: [TooltipComponent],
  templateUrl: './tarea-card.component.html',
  styleUrl: './tarea-card.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TareaCardComponent {
  tarea    = input.required<Tarea>();
  editable = input<boolean>(false); // admin can edit/delete
  isActive = input<boolean>(false); // highlight when selected in detail panel

  editClicked     = output<Tarea>();
  deleteClicked   = output<Tarea>();
  approveClicked  = output<Tarea>();

  readonly PrioridadTarea = PrioridadTarea;
  readonly EstadoTarea    = EstadoTarea;

  isCompletada = computed(() => this.tarea().estado === EstadoTarea.COMPLETADA);
  isEnRevision = computed(() => this.tarea().estado === EstadoTarea.EN_REVISION);

  prioridadLabel = computed(() => {
    switch (this.tarea().prioridad) {
      case PrioridadTarea.URGENTE: return 'Urgente';
      case PrioridadTarea.ALTA:    return 'Alta';
      case PrioridadTarea.MEDIA:   return 'Media';
      default:                     return 'Baja';
    }
  });

  categoriaLabel = computed(() => {
    const map: Record<string, string> = {
      limpieza:       'Limpieza',
      recepcion:      'Recepción',
      mantenimiento:  'Mantenimiento',
      administrativo: 'Administrativo',
      clinico:        'Clínico',
      inventario:     'Inventario',
      otro:           'Otro',
    };
    return map[this.tarea().categoria] ?? this.tarea().categoria;
  });

  diasRestantes = computed(() => {
    const venc = this.tarea().fechaVencimiento;
    if (!venc) return null;
    const ms = venc.toDate().getTime() - Date.now();
    return Math.ceil(ms / (1000 * 60 * 60 * 24));
  });

  vencimientoColor = computed(() => {
    const dias = this.diasRestantes();
    if (dias === null) return '';
    if (dias < 0)  return 'text-red-600';
    if (dias <= 1) return 'text-amber-600';
    if (dias <= 3) return 'text-amber-500';
    return 'text-[var(--c-500)]';
  });

  progresoBar = computed(() => Math.min(100, Math.max(0, this.tarea().progreso)));
}

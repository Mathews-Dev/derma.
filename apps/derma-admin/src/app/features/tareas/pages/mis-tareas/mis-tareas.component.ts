import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnDestroy,
  OnInit,
  signal,
} from '@angular/core';
import { DatePipe, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Timestamp } from 'firebase/firestore';
import { Subject, takeUntil } from 'rxjs';
import { CdkDragDrop, DragDropModule, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { AuthService, TareasService } from '@derma/firebase';
import {
  ComentarioTarea,
  EstadoTarea,
  KANBAN_COLUMNAS,
  Tarea,
} from '@derma/models';
import {
  ToastService,
  UiLoaderCardComponent,
  UiPageHeaderComponent,
} from '@derma/ui';
import { TareaCardComponent } from '../../ui/tarea-card/tarea-card.component';

@Component({
  selector: 'app-mis-tareas',
  standalone: true,
  imports: [
    DatePipe,
    NgClass,
    FormsModule,
    DragDropModule,
    UiPageHeaderComponent,
    UiLoaderCardComponent,
    TareaCardComponent,
  ],
  templateUrl: './mis-tareas.component.html',
  styleUrl: './mis-tareas.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MisTareasComponent implements OnInit, OnDestroy {
  private readonly tareasService = inject(TareasService);
  private readonly authService   = inject(AuthService);
  private readonly toast         = inject(ToastService);
  private readonly destroy$      = new Subject<void>();

  readonly COLUMNAS    = KANBAN_COLUMNAS;
  readonly EstadoTarea = EstadoTarea;

  isLoading  = signal(true);
  allTareas  = signal<Tarea[]>([]);
  isDragging = signal(false);

  // Panel de detalle lateral
  activaTareaId      = signal<string | null>(null);
  tareaActiva        = computed(() => this.allTareas().find(t => t.id === this.activaTareaId()) ?? null);
  comentarioTexto    = signal('');
  isSavingComentario = signal(false);

  // Edicion de comentarios
  comentarioEditandoId    = signal<string | null>(null);
  comentarioEditandoTexto = signal('');

  uid = computed(() => this.authService.currentUser()?.uid ?? '');
  nombreUsuario = computed(() => {
    const u = this.authService.currentUser();
    return u ? `${u.nombre} ${u.apellido}` : '';
  });

  // Grupos por columna kanban
  columnaMap = computed<Record<string, Tarea[]>>(() => {
    const map: Record<string, Tarea[]> = {};
    for (const col of this.COLUMNAS) {
      map[col.estado] = this.allTareas().filter(t => t.estado === col.estado);
    }
    return map;
  });

  columnIds = computed(() => this.COLUMNAS.map(c => 'emp-col-' + c.estado));

  // Stats rapidas
  totalUrgentes    = computed(() => this.allTareas().filter(t => t.esUrgente && t.estado !== EstadoTarea.COMPLETADA).length);
  totalCompletadas = computed(() => this.allTareas().filter(t => t.estado === EstadoTarea.COMPLETADA).length);

  ngOnInit(): void {
    const uid = this.uid();
    if (!uid) return;
    this.tareasService.getByEmpleado(uid)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: tareas => {
          this.allTareas.set(tareas);
          this.isLoading.set(false);
        },
        error: () => {
          this.toast.error('Error al cargar tus tareas');
          this.isLoading.set(false);
        },
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  async onDrop(event: CdkDragDrop<Tarea[]>, nuevoEstado: EstadoTarea): Promise<void> {
    if (nuevoEstado === EstadoTarea.COMPLETADA) {
      this.toast.warning('Solo un administrador puede completar tareas');
      return;
    }
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
      return;
    }
    const tarea = event.previousContainer.data[event.previousIndex];
    if (tarea.estado === EstadoTarea.COMPLETADA) {
      this.toast.warning('No puedes mover una tarea completada');
      return;
    }
    transferArrayItem(event.previousContainer.data, event.container.data, event.previousIndex, event.currentIndex);
    this.allTareas.update(list =>
      list.map(t => t.id === tarea.id ? { ...t, estado: nuevoEstado } : t),
    );
    try {
      await this.tareasService.cambiarEstado(tarea.id, nuevoEstado);
    } catch {
      this.toast.error('No se pudo mover la tarea');
      this.allTareas.update(list =>
        list.map(t => t.id === tarea.id ? { ...t, estado: tarea.estado } : t),
      );
    }
  }

  onDragStarted(): void {
    this.isDragging.set(true);
  }

  onDragEnded(): void {
    // Small delay so the click that fires right after drop doesn't open the panel
    setTimeout(() => this.isDragging.set(false), 50);
  }

  onCardClick(tarea: Tarea): void {
    if (this.isDragging()) return;
    this.abrirDetalle(tarea);
  }

  abrirDetalle(tarea: Tarea): void {
    this.activaTareaId.set(tarea.id);
    this.comentarioTexto.set('');
    this.comentarioEditandoId.set(null);
  }

  cerrarDetalle(): void {
    this.activaTareaId.set(null);
    this.comentarioEditandoId.set(null);
  }

  async cambiarEstado(tarea: Tarea, estado: EstadoTarea): Promise<void> {
    try {
      await this.tareasService.cambiarEstado(tarea.id, estado);
      this.toast.success('Estado actualizado');
      this.allTareas.update(list => list.map(t => t.id === tarea.id ? { ...t, estado } : t));
    } catch {
      this.toast.error('No se pudo actualizar el estado');
    }
  }

  async actualizarProgreso(tarea: Tarea, progreso: number): Promise<void> {
    try {
      await this.tareasService.actualizarProgreso(tarea.id, progreso);
      this.allTareas.update(list => list.map(t => t.id === tarea.id ? { ...t, progreso } : t));
    } catch {
      this.toast.error('No se pudo actualizar el progreso');
    }
  }

  async enviarComentario(): Promise<void> {
    const texto = this.comentarioTexto().trim();
    const tarea = this.tareaActiva();
    if (!texto || !tarea) return;
    this.isSavingComentario.set(true);
    const comentario: ComentarioTarea = {
      id:          crypto.randomUUID(),
      autorUid:    this.uid(),
      autorNombre: this.nombreUsuario(),
      texto,
      fecha:       Timestamp.now(),
    };
    try {
      await this.tareasService.agregarComentario(tarea.id, comentario);
      this.comentarioTexto.set('');
      this.toast.success('Comentario agregado');
    } catch {
      this.toast.error('No se pudo agregar el comentario');
    } finally {
      this.isSavingComentario.set(false);
    }
  }

  iniciarEdicionComentario(c: ComentarioTarea): void {
    this.comentarioEditandoId.set(c.id);
    this.comentarioEditandoTexto.set(c.texto);
  }

  cancelarEdicionComentario(): void {
    this.comentarioEditandoId.set(null);
    this.comentarioEditandoTexto.set('');
  }

  async guardarEdicionComentario(tarea: Tarea): Promise<void> {
    const texto = this.comentarioEditandoTexto().trim();
    const id    = this.comentarioEditandoId();
    if (!texto || !id) return;
    const nuevos = tarea.comentarios.map(c => c.id === id ? { ...c, texto } : c);
    try {
      await this.tareasService.actualizarComentarios(tarea.id, nuevos);
      this.cancelarEdicionComentario();
    } catch {
      this.toast.error('No se pudo guardar el comentario');
    }
  }

  async eliminarComentario(tarea: Tarea, comentarioId: string): Promise<void> {
    const nuevos = tarea.comentarios.filter(c => c.id !== comentarioId);
    try {
      await this.tareasService.actualizarComentarios(tarea.id, nuevos);
    } catch {
      this.toast.error('No se pudo eliminar el comentario');
    }
  }

  siguienteEstado(tarea: Tarea): { estado: EstadoTarea; label: string } | null {
    switch (tarea.estado) {
      case EstadoTarea.PENDIENTE:   return { estado: EstadoTarea.EN_PROGRESO, label: 'Iniciar tarea' };
      case EstadoTarea.EN_PROGRESO: return { estado: EstadoTarea.EN_REVISION, label: 'Enviar a revision' };
      case EstadoTarea.EN_REVISION: return null; // admin must approve
      default:                      return null;
    }
  }

  diasRestantes(tarea: Tarea): number | null {
    if (!tarea.fechaVencimiento) return null;
    return Math.ceil((tarea.fechaVencimiento.toDate().getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  }

  estadoLabel(estado: EstadoTarea): string {
    const map: Record<EstadoTarea, string> = {
      [EstadoTarea.PENDIENTE]:   'Pendiente',
      [EstadoTarea.EN_PROGRESO]: 'En Progreso',
      [EstadoTarea.EN_REVISION]: 'En Revision',
      [EstadoTarea.COMPLETADA]:  'Completada',
      [EstadoTarea.CANCELADA]:   'Cancelada',
      [EstadoTarea.VENCIDA]:     'Vencida',
    };
    return map[estado];
  }

  colorColumna(estado: EstadoTarea): string {
    switch (estado) {
      case EstadoTarea.PENDIENTE:   return 'border-t-[var(--c-400)]';
      case EstadoTarea.EN_PROGRESO: return 'border-t-blue-400';
      case EstadoTarea.EN_REVISION: return 'border-t-amber-400';
      case EstadoTarea.COMPLETADA:  return 'border-t-emerald-400';
      default: return '';
    }
  }

  iconColumna(estado: EstadoTarea): string {
    switch (estado) {
      case EstadoTarea.PENDIENTE:   return 'M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z';
      case EstadoTarea.EN_PROGRESO: return 'M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z';
      case EstadoTarea.EN_REVISION: return 'M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.964-7.178Z M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z';
      case EstadoTarea.COMPLETADA:  return 'm4.5 12.75 6 6 9-13.5';
      default: return '';
    }
  }
}

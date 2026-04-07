import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  OnDestroy,
  OnInit,
  signal,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { Timestamp } from 'firebase/firestore';
import { CdkDragDrop, DragDropModule, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { AuthService, TareasService } from '@derma/firebase';
import {
  ComentarioTarea,
  ConfigTareas,
  DIAS_ARCHIVO_DEFAULT,
  EstadoTarea,
  KANBAN_COLUMNAS,
  PrioridadTarea,
  RolUsuario,
  Tarea,
  TareaInput,
  Usuario,
} from '@derma/models';
import {
  ToastService,
  UiLoaderCardComponent,
  UiPageHeaderComponent,
  UiButtonComponent,
  ToggleComponent,
  UiDropdownSelectComponent,
  TooltipComponent,
  SelectOption
} from '@derma/ui';
import { TareaCardComponent } from '../../ui/tarea-card/tarea-card.component';
import { TareaFormModalComponent } from '../../ui/tarea-form-modal/tarea-form-modal.component';

@Component({
  selector: 'app-tareas-admin',
  standalone: true,
  imports: [
    DatePipe,
    FormsModule,
    RouterLink,
    DragDropModule,
    UiPageHeaderComponent,
    UiLoaderCardComponent,
    TareaCardComponent,
    TareaFormModalComponent,
    UiButtonComponent,
    ToggleComponent,
    UiDropdownSelectComponent,
    TooltipComponent,
  ],
  templateUrl: './tareas-admin.component.html',
  styleUrl: './tareas-admin.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TareasAdminComponent implements OnInit, OnDestroy {
  private readonly tareasService = inject(TareasService);
  private readonly authService   = inject(AuthService);
  private readonly toast         = inject(ToastService);
  private readonly destroy$      = new Subject<void>();

  readonly COLUMNAS       = KANBAN_COLUMNAS;
  readonly EstadoTarea    = EstadoTarea;
  readonly PrioridadTarea = PrioridadTarea;

  isLoading   = signal(true);
  isSaving    = signal(false);
  modalOpen   = signal(false);

  tareaEditando        = signal<Tarea | null>(null);
  tareaAEliminar       = signal<Tarea | null>(null);
  tareaAReabrir        = signal<Tarea | null>(null);
  estadoDestinoReabrir = signal<EstadoTarea | null>(null);
  isClosingReabrir     = signal(false);
  estadoDestinoLabel   = computed(() => {
    const e = this.estadoDestinoReabrir();
    return e ? TareasService.estadoLabel(e) : '';
  });

  allTareas  = signal<Tarea[]>([]);
  empleados  = signal<Usuario[]>([]);

  // UI toggles
  mostrarCompletadas   = signal(true);
  panelConfigAbierto   = signal(false);

  // Config auto-archivado
  config = signal<ConfigTareas>({ autoArchivarHabilitado: true, autoArchivarDias: DIAS_ARCHIVO_DEFAULT });
  configDirty = signal(false);

  adminUid = computed(() => this.authService.currentUser()?.uid ?? '');
  adminNombreUsuario = computed(() => {
    const u = this.authService.currentUser();
    return u ? `${u.nombre} ${u.apellido}` : 'Admin';
  });

  // Admin detail panel
  adminActivaId            = signal<string | null>(null);
  adminTareaActiva         = computed(() => this.allTareas().find(t => t.id === this.adminActivaId()) ?? null);
  adminComentarioTexto     = signal('');
  isSavingAdminComentario  = signal(false);
  isDraggingAdmin          = signal(false);
  isClosingPanel           = signal(false);

  readonly estadoLabel = TareasService.estadoLabel;
  protected readonly Math = Math;

  private vencimientosVerificados = false;

  // Filtros
  filtroUid       = signal<string>('');
  filtroPrioridad = signal<PrioridadTarea | ''>('');

  empleadosOptions = computed<SelectOption[]>(() => {
    return [
      { id: '', label: 'Todos los empleados' },
      ...this.empleados().map(emp => ({ id: emp.uid, label: `${emp.nombre} ${emp.apellido}` }))
    ];
  });

  prioridadesOptions: SelectOption[] = [
    { id: '', label: 'Todas las prioridades' },
    { id: 'urgente', label: 'Urgente' },
    { id: 'alta', label: 'Alta' },
    { id: 'media', label: 'Media' },
    { id: 'baja', label: 'Baja' },
  ];

  tareasFiltradas = computed(() => {
    let list = this.allTareas();
    const uid  = this.filtroUid();
    const prio = this.filtroPrioridad();
    if (uid)  list = list.filter(t => t.asignadaA.includes(uid));
    if (prio) list = list.filter(t => t.prioridad === prio);
    return list;
  });

  columnaMap = computed<Record<string, Tarea[]>>(() => {
    const map: Record<string, Tarea[]> = {};
    for (const col of this.COLUMNAS) {
      if (col.estado === EstadoTarea.COMPLETADA && !this.mostrarCompletadas()) {
        map[col.estado] = [];
      } else {
        map[col.estado] = this.tareasFiltradas().filter(t => t.estado === col.estado);
      }
    }
    return map;
  });

  // Stats
  totalPendientes = computed(() => this.allTareas().filter(t => t.estado === EstadoTarea.PENDIENTE).length);
  totalUrgentes   = computed(() => this.allTareas().filter(t => t.esUrgente && t.estado !== EstadoTarea.COMPLETADA && t.estado !== EstadoTarea.CANCELADA).length);
  totalVencidas   = computed(() => {
    const now = Date.now();
    return this.allTareas().filter(t => {
      if (!t.fechaVencimiento) return false;
      return t.fechaVencimiento.toDate().getTime() < now && t.estado !== EstadoTarea.COMPLETADA;
    }).length;
  });
  totalCompletadasMes = computed(() => {
    const start = new Date();
    start.setDate(1); start.setHours(0, 0, 0, 0);
    return this.allTareas().filter(t => {
      if (t.estado !== EstadoTarea.COMPLETADA || !t.fechaCompletada) return false;
      return t.fechaCompletada.toDate() >= start;
    }).length;
  });
  totalEnRevision = computed(() => this.allTareas().filter(t => t.estado === EstadoTarea.EN_REVISION).length);

  columnIds = computed(() => this.COLUMNAS.map(c => 'col-' + c.estado));

  constructor() {
    // Marcar config como dirty cuando el usuario la edita
    effect(() => {
      this.config();
      this.configDirty.set(true);
    }, { allowSignalWrites: true });
  }

  ngOnInit(): void {
    this.loadTareas();
    this.loadEmpleados();
    this.loadConfig();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadTareas(): void {
    this.isLoading.set(true);
    this.tareasService.getAll()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: tareas => {
          this.allTareas.set(tareas);
          this.isLoading.set(false);
          this.runAutoArchive();
          if (!this.vencimientosVerificados) {
            this.vencimientosVerificados = true;
            this.tareasService.verificarVencimientos(tareas);
          }
        },
        error: () => {
          this.toast.error('Error al cargar tareas');
          this.isLoading.set(false);
        },
      });
  }

  private loadEmpleados(): void {
    this.tareasService.getEmpleados()
      .pipe(takeUntil(this.destroy$))
      .subscribe({ next: users => this.empleados.set(users.filter(TareasService.esAsignable)) });
  }

  private async loadConfig(): Promise<void> {
    const cfg = await this.tareasService.getConfigTareas();
    if (cfg) {
      this.config.set(cfg);
    }
    // Reset dirty flag after loading (the effect above fires on set)
    this.configDirty.set(false);
  }

  private async runAutoArchive(): Promise<void> {
    const cfg = this.config();
    if (!cfg.autoArchivarHabilitado) return;
    const uid = this.adminUid();
    await this.tareasService.autoArchivarCompletadas(cfg.autoArchivarDias, uid);
  }

  async onDrop(event: CdkDragDrop<Tarea[]>, nuevoEstado: EstadoTarea): Promise<void> {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
      return;
    }
    const tarea = event.previousContainer.data[event.previousIndex];

    // Modal de confirmacion para RE-ABRIR tareas completadas
    if (tarea.estado === EstadoTarea.COMPLETADA && nuevoEstado !== EstadoTarea.COMPLETADA) {
      this.tareaAReabrir.set(tarea);
      this.estadoDestinoReabrir.set(nuevoEstado);
      return; // allTareas no cambia → columnaMap recomputa → UI revierte
    }

    transferArrayItem(event.previousContainer.data, event.container.data, event.previousIndex, event.currentIndex);
    this.allTareas.update(list => list.map(t => t.id === tarea.id ? { ...t, estado: nuevoEstado } : t));
    try {
      await this.tareasService.cambiarEstado(tarea.id, nuevoEstado, this.adminUid(), tarea);
    } catch {
      this.toast.error('No se pudo mover la tarea');
      this.allTareas.update(list => list.map(t => t.id === tarea.id ? { ...t, estado: tarea.estado } : t));
    }
  }

  async aprobar(tarea: Tarea): Promise<void> {
    try {
      await this.tareasService.aprobar(tarea.id, this.adminUid(), tarea);
      this.toast.success(`"${tarea.titulo}" aprobada`);
      this.allTareas.update(list => list.map(t => t.id === tarea.id
        ? { ...t, estado: EstadoTarea.COMPLETADA, progreso: 100, aprobadaPor: this.adminUid() }
        : t));
    } catch {
      this.toast.error('No se pudo aprobar la tarea');
    }
  }

  async confirmarReabrir(): Promise<void> {
    const tarea = this.tareaAReabrir();
    const estado = this.estadoDestinoReabrir();
    if (!tarea || !estado) return;
    const prevEstado = tarea.estado;
    this.allTareas.update(list => list.map(t => t.id === tarea.id ? { ...t, estado } : t));
    this.isClosingReabrir.set(false);
    this.tareaAReabrir.set(null);
    this.estadoDestinoReabrir.set(null);
    try {
      await this.tareasService.cambiarEstado(tarea.id, estado, this.adminUid(), tarea);
    } catch {
      this.toast.error('No se pudo re-abrir la tarea');
      this.allTareas.update(list => list.map(t => t.id === tarea.id ? { ...t, estado: prevEstado } : t));
    }
  }

  triggerCancelarReabrir(): void {
    if (this.isClosingReabrir()) return;
    this.isClosingReabrir.set(true);
    setTimeout(() => {
      this.cancelarReabrir();
    }, 400); // 400ms matches the animation duration
  }

  triggerConfirmarReabrir(): void {
    if (this.isClosingReabrir()) return;
    this.isClosingReabrir.set(true);
    setTimeout(() => {
      this.confirmarReabrir();
    }, 400);
  }

  cancelarReabrir(): void {
    this.isClosingReabrir.set(false);
    this.tareaAReabrir.set(null);
    this.estadoDestinoReabrir.set(null);
  }

  abrirDetalleAdmin(tarea: Tarea): void {
    this.adminActivaId.set(tarea.id);
    this.adminComentarioTexto.set('');
  }

  cerrarDetalleAdmin(): void {
    this.isClosingPanel.set(true);
    setTimeout(() => {
      this.adminActivaId.set(null);
      this.adminComentarioTexto.set('');
      this.isClosingPanel.set(false);
    }, 380);
  }

  onAdminDragStarted(): void {
    this.isDraggingAdmin.set(true);
  }

  onAdminDragEnded(): void {
    setTimeout(() => this.isDraggingAdmin.set(false), 50);
  }

  onAdminCardClick(tarea: Tarea): void {
    if (this.isDraggingAdmin()) return;
    this.abrirDetalleAdmin(tarea);
  }

  async enviarComentarioAdmin(): Promise<void> {
    const tarea = this.adminTareaActiva();
    const texto = this.adminComentarioTexto().trim();
    if (!tarea || !texto) return;
    this.isSavingAdminComentario.set(true);
    const comentario: ComentarioTarea = {
      id:          crypto.randomUUID(),
      autorUid:    this.adminUid(),
      autorNombre: this.adminNombreUsuario(),
      texto,
      fecha:       Timestamp.now(),
    };
    try {
      await this.tareasService.agregarComentario(tarea.id, comentario, tarea);
      this.adminComentarioTexto.set('');
    } catch {
      this.toast.error('No se pudo enviar el comentario');
    } finally {
      this.isSavingAdminComentario.set(false);
    }
  }

  async eliminarComentarioAdmin(tarea: Tarea, comentarioId: string): Promise<void> {
    const nuevos = (tarea.comentarios ?? []).filter((c: ComentarioTarea) => c.id !== comentarioId);
    try {
      await this.tareasService.actualizarComentarios(tarea.id, nuevos);
    } catch {
      this.toast.error('No se pudo eliminar el comentario');
    }
  }

  async archivar(tarea: Tarea): Promise<void> {
    try {
      await this.tareasService.archivar(tarea.id, this.adminUid());
      this.toast.success('Tarea archivada');
      this.allTareas.update(list => list.filter(t => t.id !== tarea.id));
    } catch {
      this.toast.error('No se pudo archivar la tarea');
    }
  }

  abrirCrear(): void {
    this.tareaEditando.set(null);
    this.modalOpen.set(true);
  }

  abrirEditar(tarea: Tarea): void {
    this.tareaEditando.set(tarea);
    this.modalOpen.set(true);
  }

  cerrarModal(): void {
    this.modalOpen.set(false);
    this.tareaEditando.set(null);
  }

  async onSaved(data: TareaInput): Promise<void> {
    this.isSaving.set(true);
    try {
      const editando = this.tareaEditando();
      if (editando) {
        await this.tareasService.actualizar(editando.id, data);
        this.toast.success('Tarea actualizada');
      } else {
        await this.tareasService.crear(data);
        this.toast.success('Tarea creada');
      }
      this.cerrarModal();
    } catch (error) {
      console.error('Error al guardar la tarea: ', error);
      this.toast.error('Error al guardar la tarea');
    } finally {
      this.isSaving.set(false);
    }
  }

  confirmarEliminar(tarea: Tarea): void {
    this.tareaAEliminar.set(tarea);
  }

  async eliminar(): Promise<void> {
    const tarea = this.tareaAEliminar();
    if (!tarea) return;
    try {
      await this.tareasService.eliminar(tarea.id);
      this.toast.success('Tarea eliminada');
    } catch {
      this.toast.error('Error al eliminar');
    } finally {
      this.tareaAEliminar.set(null);
    }
  }

  async guardarConfig(): Promise<void> {
    try {
      await this.tareasService.saveConfigTareas(this.config());
      this.configDirty.set(false);
      this.toast.success('Configuracion guardada');
    } catch {
      this.toast.error('No se pudo guardar la configuracion');
    }
  }

  setConfigField<K extends keyof ConfigTareas>(key: K, value: ConfigTareas[K]): void {
    this.config.update(c => ({ ...c, [key]: value }));
  }

  nombreEmpleado(uid: string): string {
    const emp = this.empleados().find(e => e.uid === uid);
    return emp ? `${emp.nombre} ${emp.apellido}` : uid;
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

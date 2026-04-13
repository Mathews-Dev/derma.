import { Timestamp } from 'firebase/firestore';

export enum EstadoTarea {
  PENDIENTE   = 'pendiente',
  EN_PROGRESO = 'en_progreso',
  EN_REVISION = 'en_revision',
  COMPLETADA  = 'completada',
  CANCELADA   = 'cancelada',
  VENCIDA     = 'vencida',
}

export enum PrioridadTarea {
  BAJA    = 'baja',
  MEDIA   = 'media',
  ALTA    = 'alta',
  URGENTE = 'urgente',
}

export type CategoriaTarea =
  | 'limpieza'
  | 'recepcion'
  | 'mantenimiento'
  | 'administrativo'
  | 'clinico'
  | 'inventario'
  | 'compras'
  | 'otro';

export interface ComentarioTarea {
  id: string;
  autorUid: string;
  autorNombre: string;
  texto: string;
  fecha: Timestamp;
}

export interface HistorialEstadoTarea {
  estado: EstadoTarea;
  cambiadoPor: string;
  fecha: Timestamp;
}

export interface ConfigTareas {
  autoArchivarHabilitado: boolean;
  autoArchivarDias: number;
}

export const DIAS_ARCHIVO_DEFAULT = 7;

export interface Tarea {
  id: string;
  titulo: string;
  descripcion: string;

  // Estado y flujo
  estado: EstadoTarea;
  progreso: number;

  // Clasificacion
  prioridad: PrioridadTarea;
  categoria: CategoriaTarea;
  esUrgente: boolean;

  // Usuarios
  creadaPor: string;
  asignadaA: string[];
  asignadaANombres: string[];
  enProgresoPor?: string;

  // Aprobacion (flujo EN_REVISION -> COMPLETADA)
  aprobadaPor?: string;
  fechaAprobacion?: Timestamp;

  // Fechas
  fechaCreacion: Timestamp;
  fechaVencimiento?: Timestamp;
  fechaInicio?: Timestamp;
  fechaCompletada?: Timestamp;

  // Contenido
  comentarios: ComentarioTarea[];
  etiquetas?: string[];
  historial?: HistorialEstadoTarea[];

  // Archivado
  archivada: boolean;
  fechaArchivado?: Timestamp;
  archivadaPor?: string;

  // Notificaciones de vencimiento (deduplicación)
  notifVencidaEnviada?: boolean;
  notifProntoVencerEnviada?: boolean;
}

export type TareaInput = Omit<Tarea, 'id'>;

export const KANBAN_COLUMNAS: { estado: EstadoTarea; label: string }[] = [
  { estado: EstadoTarea.PENDIENTE,   label: 'Pendiente'   },
  { estado: EstadoTarea.EN_PROGRESO, label: 'En Progreso' },
  { estado: EstadoTarea.EN_REVISION, label: 'En Revision' },
  { estado: EstadoTarea.COMPLETADA,  label: 'Completada'  },
];

export const CATEGORIA_LABELS: Record<CategoriaTarea, string> = {
  limpieza:       'Limpieza',
  recepcion:      'Recepcion',
  mantenimiento:  'Mantenimiento',
  administrativo: 'Administrativo',
  clinico:        'Clinico',
  inventario:     'Inventario',
  compras:        'Compras',
  otro:           'Otro',
};

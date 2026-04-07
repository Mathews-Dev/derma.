import { Timestamp } from 'firebase/firestore';
import { PrioridadTarea } from './tarea.model';

export type TipoNotificacionAdmin =
  | 'tarea_asignada'
  | 'tarea_en_progreso'
  | 'tarea_en_revision'
  | 'tarea_aprobada'
  | 'tarea_completada'
  | 'tarea_cancelada'
  | 'tarea_reasignada'
  | 'tarea_comentario'
  | 'tarea_por_vencer'
  | 'tarea_vencida'
  | 'inventario_bajo'
  | 'sistema';

export interface NotificacionAdmin {
  id: string;
  destinatarioUid: string;
  remitenteUid?: string;
  remitenteNombre?: string;
  tipo: TipoNotificacionAdmin;
  titulo: string;
  mensaje: string;
  fecha: Timestamp;
  leida: boolean;
  prioridad?: PrioridadTarea;
  accionUrl?: string;
  accionTexto?: string;
  relacionadoId?: string;
  relacionadoTipo?: 'tarea' | 'inventario';
}

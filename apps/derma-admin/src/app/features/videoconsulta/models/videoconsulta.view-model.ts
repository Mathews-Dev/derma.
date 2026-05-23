/** Vista de videoconsulta en admin (listado y drawer). */

import type { ModalidadConsulta } from '@derma/models';

export type VideoconsultaLinkEstado = 'listo' | 'pendiente' | 'error' | 'sin_crear';

export type VideoconsultaNotificacionTipo = 'ok' | 'error';

export interface VideoconsultaNotificacionItem {
  texto: string;
  fecha: string;
  tipo: VideoconsultaNotificacionTipo;
  detalleFallo?: string;
}

export interface VideoconsultaDetalle {
  id: string;
  codigo: string;
  pacienteNombre: string;
  pacienteDni: string;
  profesionalNombre: string;
  profesionalMatricula: string;
  fechaCorta: string;
  hora: string;
  duracionMin: number;
  estadoEtiqueta: string;
  estadoBadge: 'success' | 'warning' | 'neutral';
  linkMeet: string;
  linkEstado: VideoconsultaLinkEstado;
  recordatorioEtiqueta: string | null;
  telefonoPaciente: string;
  telefonoProfesional: string;
  notificaciones: VideoconsultaNotificacionItem[];
  /** UID Firebase del profesional (conexión OAuth Calendar). */
  profesionalUid: string;
  modalidadConsulta: ModalidadConsulta;
}
/** Filas para el listado (subset + id). */
export type VideoconsultaListRow = Pick<
  VideoconsultaDetalle,
  | 'id'
  | 'codigo'
  | 'pacienteNombre'
  | 'profesionalNombre'
  | 'fechaCorta'
  | 'hora'
  | 'duracionMin'
  | 'estadoEtiqueta'
  | 'estadoBadge'
  | 'linkMeet'
  | 'linkEstado'
  | 'modalidadConsulta'
> & {
  notificacionResumen: string;
};

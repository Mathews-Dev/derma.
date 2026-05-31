import type { Timestamp } from 'firebase-admin/firestore';
import type { ModalidadConsulta } from './appointment.types';

/**
 * Video consultation data stored in Firestore
 */
export interface VideoconsultaTurnoFirestore {
  linkMeet?: string | null;
  googleEventId?: string | null;
  linkEvento?: string | null;
}

/**
 * Appointment data for sending WhatsApp notifications
 */
export interface TurnoParaNotificar {
  id: string;
  pacienteNombre: string;
  profesionalNombre: string;
  horaInicio: string;
  fecha: Timestamp;
  estado?: string;
  accessToken?: string | null;
  telefonoNotificaciones?: string | null;
  pacienteTelefono?: string | null;
  notificacionesWhatsApp: boolean;
  modalidadConsulta?: ModalidadConsulta | null;
  videoconsulta?: VideoconsultaTurnoFirestore | null;
  linkMeet?: string | null;
  recordatorioWhatsAppEnviadoAt?: Timestamp | null;
  recordatorioProgramadoPara?: Timestamp | null;
}

/**
 * Public portal appointment data for patients
 */
export interface TurnoPortalPublico {
  id: string;
  pacienteId: string;
  pacienteNombre: string;
  profesionalNombre: string;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  estado: string;
  estadoPago: string;
  monto: number;
  puedeModificar: boolean;
  horasRestantes: number;
  mensajePolitica: string;
}

/**
 * Appointment data for scheduling reminder
 */
export interface TurnoParaProgramarRecordatorio {
  id: string;
  fecha: Timestamp;
  horaInicio: string;
  notificacionesWhatsApp: boolean;
  recordatorioWhatsAppEnviadoAt?: Timestamp | null;
  modalidadConsulta?: 'presencial' | 'videoconsulta' | null;
}

/**
 * Minimal appointment data for calculating reminder time
 */
export interface TurnoParaCalcularRecordatorio {
  fecha: Timestamp;
  horaInicio: string;
  modalidadConsulta?: 'presencial' | 'videoconsulta' | null;
}

import { Usuario, HorariosLaborales, HonorariosPorTratamiento, DocumentosProfesional, DocumentosDetallados } from './usuario.model';

export interface GoogleCalendarIntegracion {
    conectado: boolean;
    emailGoogle?: string;
    calendarId?: string;
    fechaConexion?: string;
}

export interface Profesional extends Usuario {
    numeroMatriculaNacional: string;
    numeroMatriculaProvincial: string;
    tituloProfesional: string; // Ej: Cirujano Plástico
    precioConsulta?: number;

    horariosLaborales: HorariosLaborales;
    duracionConsulta: number; // minutos
    honorarios: HonorariosPorTratamiento[];
    documentos?: DocumentosProfesional;
    documentosDetalle?: DocumentosDetallados;
    /** OAuth Google Calendar (refresh token cifrado solo en backend). */
    googleCalendar?: GoogleCalendarIntegracion;
}

export interface GoogleCalendarIntegracion {
  conectado: boolean;
  refreshTokenCifrado?: string;
  emailGoogle?: string;
  calendarId?: string;
  fechaConexion?: string;
  syncConsultasPresenciales?: boolean;
}

export interface CrearEventoParams {
  turnoId: string;
  profesionalUid: string;
  tituloEvento: string;
  descripcion: string;
  fechaInicio: string;
  fechaFin: string;
  pacienteEmail: string;
  pacienteNombre: string;
  esVideoconsulta: boolean;
  telefonoNotificaciones?: string | null;
  profesionalNombre: string;
}

export interface ResultadoEvento {
  googleEventId: string;
  meetLink: string | null;
  linkEvento: string | null;
}

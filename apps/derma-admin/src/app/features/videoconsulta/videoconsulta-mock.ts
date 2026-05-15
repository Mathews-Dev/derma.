/** Tipos y datos mock hasta conectar con Firestore / Meet. */

export type VideoconsultaLinkEstado = 'listo' | 'pendiente' | 'error';
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
> & {
  notificacionResumen: string;
};

export const VIDEOCONSULTA_MOCK_DETALLES: VideoconsultaDetalle[] = [
  {
    id: 'vc-4521',
    codigo: 'VC-4521',
    pacienteNombre: 'María González',
    pacienteDni: '32.456.789',
    profesionalNombre: 'Dra. Lucía Pérez',
    profesionalMatricula: 'MN: 85421',
    fechaCorta: '14/05/24',
    hora: '16:00',
    duracionMin: 30,
    estadoEtiqueta: 'Confirmado',
    estadoBadge: 'success',
    linkMeet: 'https://meet.google.com/abc-defg-hij',
    linkEstado: 'listo',
    recordatorioEtiqueta: 'Recordatorio enviado a las 15:00',
    telefonoPaciente: '+54 9 11 4567-8901',
    telefonoProfesional: '+54 9 11 1234-5678',
    notificaciones: [
      { texto: 'Aviso de turno enviado al paciente', fecha: '14/05/2024 09:00', tipo: 'ok' },
      { texto: 'Recordatorio 1h antes enviado', fecha: '14/05/2024 15:00', tipo: 'ok' },
      {
        texto: 'Aviso enviado al profesional',
        fecha: '14/05/2024 09:01',
        tipo: 'error',
        detalleFallo: 'Falló',
      },
    ],
  },
  {
    id: 'vc-4522',
    codigo: 'VC-4522',
    pacienteNombre: 'Juan Pérez',
    pacienteDni: '28.112.445',
    profesionalNombre: 'Dr. Martín Rodríguez',
    profesionalMatricula: 'MN: 99100',
    fechaCorta: '16/05/24',
    hora: '09:30',
    duracionMin: 45,
    estadoEtiqueta: 'Pendiente',
    estadoBadge: 'warning',
    linkMeet: '',
    linkEstado: 'pendiente',
    recordatorioEtiqueta: null,
    telefonoPaciente: '+54 9 351 600-2211',
    telefonoProfesional: '+54 9 11 9988-7766',
    notificaciones: [{ texto: 'Videoconsulta creada', fecha: '13/05/2024 11:20', tipo: 'ok' }],
  },
  {
    id: 'vc-4523',
    codigo: 'VC-4523',
    pacienteNombre: 'Ana Fernández',
    pacienteDni: '40.221.003',
    profesionalNombre: 'Dra. Lucía Pérez',
    profesionalMatricula: 'MN: 85421',
    fechaCorta: '12/05/24',
    hora: '14:00',
    duracionMin: 30,
    estadoEtiqueta: 'Confirmado',
    estadoBadge: 'success',
    linkMeet: 'https://meet.google.com/xyz-abcd-efg',
    linkEstado: 'listo',
    recordatorioEtiqueta: 'Recordatorio programado',
    telefonoPaciente: '+54 9 223 555-4411',
    telefonoProfesional: '+54 9 11 1234-5678',
    notificaciones: [
      { texto: 'Aviso al paciente enviado', fecha: '11/05/2024 18:00', tipo: 'ok' },
      { texto: 'Aviso al profesional enviado', fecha: '11/05/2024 18:00', tipo: 'ok' },
    ],
  },
];

export function videoconsultaMockListRows(): VideoconsultaListRow[] {
  return VIDEOCONSULTA_MOCK_DETALLES.map(d => ({
    id: d.id,
    codigo: d.codigo,
    pacienteNombre: d.pacienteNombre,
    profesionalNombre: d.profesionalNombre,
    fechaCorta: d.fechaCorta,
    hora: d.hora,
    duracionMin: d.duracionMin,
    estadoEtiqueta: d.estadoEtiqueta,
    estadoBadge: d.estadoBadge,
    linkMeet: d.linkMeet,
    linkEstado: d.linkEstado,
    notificacionResumen:
      d.notificaciones[d.notificaciones.length - 1]?.texto ?? '—',
  }));
}

export function videoconsultaMockPorId(id: string): VideoconsultaDetalle | undefined {
  return VIDEOCONSULTA_MOCK_DETALLES.find(v => v.id === id);
}

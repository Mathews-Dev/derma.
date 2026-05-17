import {
  TemplateButtonComponent,
  TemplateComponent,
  TemplateMessage,
} from './types';

function bodyParams(...values: string[]): TemplateComponent[] {
  return [{
    type: 'body',
    parameters: values.map(text => ({ type: 'text', text })),
  }];
}

function urlButton(meetCode: string): TemplateButtonComponent {
  return {
    type: 'button',
    sub_type: 'url',
    index: '0',
    parameters: [{ type: 'text', text: meetCode }],
  };
}

function withMeetButton(
  body: TemplateComponent[],
  meetCode: string,
): TemplateMessage['components'] {
  return [...body, urlButton(meetCode)];
}

export const templates = {

  turnoConfirmado: (
    nombre: string,
    fecha: string,
    hora: string,
    profesional: string,
  ): TemplateMessage => ({
    name: 'derma_turno_confirmado',
    language: { code: 'es_AR' },
    components: bodyParams(nombre, fecha, hora, profesional),
  }),

  turnoRecordatorio: (
    nombre: string,
    fecha: string,
    hora: string,
    profesional: string,
  ): TemplateMessage => ({
    name: 'derma_turno_recordatorio',
    language: { code: 'es_AR' },
    components: bodyParams(nombre, fecha, hora, profesional),
  }),

  turnoCancelado: (
    nombre: string,
    fecha: string,
    hora: string,
    motivo: string,
  ): TemplateMessage => ({
    name: 'derma_turno_cancelado',
    language: { code: 'es_AR' },
    components: bodyParams(nombre, fecha, hora, motivo),
  }),

  turnoReprogramado: (
    nombre: string,
    fechaNueva: string,
    horaNueva: string,
    profesional: string,
  ): TemplateMessage => ({
    name: 'derma_turno_reprogramado',
    language: { code: 'es_AR' },
    components: bodyParams(nombre, fechaNueva, horaNueva, profesional),
  }),

  turnoNoAsistio: (
    nombre: string,
    fecha: string,
    hora: string,
  ): TemplateMessage => ({
    name: 'derma_turno_no_asistio',
    language: { code: 'es_AR' },
    components: bodyParams(nombre, fecha, hora),
  }),

  videoconsultaConfirmada: (
    pacienteNombre: string,
    profesionalNombre: string,
    fechaHora: string,
    meetCode: string,
  ): TemplateMessage => ({
    name: 'derma_videoconsulta',
    language: { code: 'es_AR' },
    components: withMeetButton(
      bodyParams(pacienteNombre, profesionalNombre, fechaHora),
      meetCode,
    ),
  }),

  videoconsultaRecordatorio: (
    pacienteNombre: string,
    profesionalNombre: string,
    hora: string,
    meetCode: string,
  ): TemplateMessage => ({
    name: 'derma_videoconsulta_recordatorio',
    language: { code: 'es_AR' },
    components: withMeetButton(
      bodyParams(pacienteNombre, profesionalNombre, hora),
      meetCode,
    ),
  }),

} as const;

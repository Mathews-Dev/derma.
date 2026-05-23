import {
  TemplateButtonComponent,
  TemplateComponent,
  TemplateMessage,
} from './types';

const TEMPLATE_LANG = { code: 'es_AR' } as const;

function bodyParams(...values: string[]): TemplateComponent[] {
  return [{
    type: 'body',
    parameters: values.map(text => ({ type: 'text', text })),
  }];
}

function verTurnoUrlButton(accessToken: string): TemplateButtonComponent {
  return {
    type: 'button',
    sub_type: 'url',
    index: '0',
    parameters: [{ type: 'text', text: accessToken }],
  };
}

function withVerTurnoButton(
  body: TemplateComponent[],
  accessToken: string,
): TemplateMessage['components'] {
  return [...body, verTurnoUrlButton(accessToken)];
}

function urlButtonMeet(meetCode: string): TemplateButtonComponent {
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
  return [...body, urlButtonMeet(meetCode)];
}

export const templates = {

  turnoConfirmado: (
    nombre: string,
    fecha: string,
    hora: string,
    profesional: string,
    accessToken: string,
  ): TemplateMessage => ({
    name: 'derma_turno_confirmado',
    language: TEMPLATE_LANG,
    components: withVerTurnoButton(
      bodyParams(nombre, fecha, hora, profesional),
      accessToken,
    ),
  }),

  turnoRecordatorio: (
    nombre: string,
    fecha: string,
    hora: string,
    profesional: string,
    accessToken: string,
  ): TemplateMessage => ({
    name: 'derma_turno_recordatorio',
    language: TEMPLATE_LANG,
    components: withVerTurnoButton(
      bodyParams(nombre, fecha, hora, profesional),
      accessToken,
    ),
  }),

  turnoCancelado: (
    nombre: string,
    fecha: string,
    hora: string,
  ): TemplateMessage => ({
    name: 'derma_turno_cancelado',
    language: TEMPLATE_LANG,
    components: bodyParams(nombre, fecha, hora),
  }),

  turnoReprogramado: (
    nombre: string,
    fechaNueva: string,
    horaNueva: string,
    profesional: string,
    accessToken: string,
  ): TemplateMessage => ({
    name: 'derma_turno_reprogramado',
    language: TEMPLATE_LANG,
    components: withVerTurnoButton(
      bodyParams(nombre, fechaNueva, horaNueva, profesional),
      accessToken,
    ),
  }),

  turnoNoAsistio: (
    nombre: string,
    fecha: string,
    hora: string,
  ): TemplateMessage => ({
    name: 'derma_turno_no_asistio',
    language: TEMPLATE_LANG,
    components: bodyParams(nombre, fecha, hora),
  }),

  videoconsultaConfirmada: (
    pacienteNombre: string,
    profesionalNombre: string,
    fechaHora: string,
    meetCode: string,
  ): TemplateMessage => ({
    name: 'derma_videoconsulta',
    language: TEMPLATE_LANG,
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
    language: TEMPLATE_LANG,
    components: withMeetButton(
      bodyParams(pacienteNombre, profesionalNombre, hora),
      meetCode,
    ),
  }),

} as const;

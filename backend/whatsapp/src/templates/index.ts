import { TemplateMessage } from './types';

function bodyParams(...values: string[]): TemplateMessage['components'] {
  return [{
    type: 'body',
    parameters: values.map(text => ({ type: 'text', text })),
  }];
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

} as const;

export const env = {
  get META_ACCESS_TOKEN()    { return requireEnv('META_ACCESS_TOKEN'); },
  get META_PHONE_NUMBER_ID() { return requireEnv('META_PHONE_NUMBER_ID'); },
  get META_APP_SECRET()      { return requireEnv('META_APP_SECRET'); },
  get WEBHOOK_VERIFY_TOKEN() { return requireEnv('WEBHOOK_VERIFY_TOKEN'); },
  /** Puerto del API WhatsApp (no usar el mismo que mercadopago). */
  PORT: process.env['WHATSAPP_PORT'] ?? process.env['PORT'] ?? '3003',
  WHATSAPP_SIMULATION: process.env['WHATSAPP_SIMULATION'] === 'true',
  /** @deprecated Usar `META_TEMPLATE_LANG_*` por plantilla. */
  get META_TEMPLATE_LANGUAGE() {
    return process.env['META_TEMPLATE_LANGUAGE'] ?? 'es_AR';
  },
  get META_TEMPLATE_LANG_CONFIRMADO() {
    return process.env['META_TEMPLATE_LANG_CONFIRMADO'] ?? 'es_AR';
  },
  get META_TEMPLATE_LANG_CANCELADO() {
    return process.env['META_TEMPLATE_LANG_CANCELADO'] ?? 'es_AR';
  },
  get META_TEMPLATE_LANG_RECORDATORIO() {
    return process.env['META_TEMPLATE_LANG_RECORDATORIO'] ?? 'es_AR';
  },
  get META_TEMPLATE_LANG_REPROGRAMADO() {
    return process.env['META_TEMPLATE_LANG_REPROGRAMADO'] ?? 'es_AR';
  },
  get META_TEMPLATE_LANG_NO_ASISTIO() {
    return process.env['META_TEMPLATE_LANG_NO_ASISTIO'] ?? 'es_AR';
  },
  get META_TEMPLATE_LANG_VIDEOCONSULTA() {
    return process.env['META_TEMPLATE_LANG_VIDEOCONSULTA'] ?? 'es_AR';
  },
} as const;

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) throw new Error(`Variable de entorno faltante: ${key}`);
  return value;
}
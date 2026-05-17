export const env = {
  get META_ACCESS_TOKEN()    { return requireEnv('META_ACCESS_TOKEN'); },
  get META_PHONE_NUMBER_ID() { return requireEnv('META_PHONE_NUMBER_ID'); },
  get META_APP_SECRET()      { return requireEnv('META_APP_SECRET'); },
  get WEBHOOK_VERIFY_TOKEN() { return requireEnv('WEBHOOK_VERIFY_TOKEN'); },
  PORT: process.env['PORT'] ?? '3001',
  WHATSAPP_SIMULATION: process.env['WHATSAPP_SIMULATION'] === 'true',
  /** Debe coincidir con el idioma aprobado en Meta (a veces es `es`, no `es_AR`). */
  get META_TEMPLATE_LANGUAGE() {
    return process.env['META_TEMPLATE_LANGUAGE'] ?? 'es_AR';
  },
} as const;

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) throw new Error(`Variable de entorno faltante: ${key}`);
  return value;
}
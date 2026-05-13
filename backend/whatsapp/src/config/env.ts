export const env = {
  get META_ACCESS_TOKEN()    { return requireEnv('META_ACCESS_TOKEN'); },
  get META_PHONE_NUMBER_ID() { return requireEnv('META_PHONE_NUMBER_ID'); },
  get META_APP_SECRET()      { return requireEnv('META_APP_SECRET'); },
  get WEBHOOK_VERIFY_TOKEN() { return requireEnv('WEBHOOK_VERIFY_TOKEN'); },
  PORT: process.env['PORT'] ?? '3001',
} as const;

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) throw new Error(`Variable de entorno faltante: ${key}`);
  return value;
}
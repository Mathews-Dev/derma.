export const env = {
  get MERCADO_PAGO_TOKEN() { return requireEnv('MERCADO_PAGO_TOKEN'); },
  PORT: process.env['PORT'] ?? '3000',
} as const;

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) throw new Error(`Variable de entorno faltante: ${key}`);
  return value;
}

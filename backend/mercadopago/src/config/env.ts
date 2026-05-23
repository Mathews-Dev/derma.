export const env = {
  get MERCADO_PAGO_TOKEN() { return requireEnv('MERCADO_PAGO_TOKEN'); },
  PORT: process.env['PORT'] ?? '3000',
  get IS_DEV() {
    return process.env['NODE_ENV'] !== 'production';
  },
  FRONTEND_URL: process.env['FRONTEND_URL'] ?? '',
  BACKEND_URL: process.env['BACKEND_URL'] ?? process.env['ngrok_url'] ?? '',
  NOTIFICATION_URL: process.env['NOTIFICATION_URL'] ?? '',
} as const;

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) throw new Error(`Variable de entorno faltante: ${key}`);
  return value;
}

export function logMpStartup(): void {
  const token = env.MERCADO_PAGO_TOKEN;
  const tokenHint = token.length > 8 ? `…${token.slice(-6)}` : '(corto)';
  console.log('[Derma MercadoPago] Config:', {
    port: env.PORT,
    frontendUrl: env.FRONTEND_URL || '(default localhost:4200)',
    backendUrl: env.BACKEND_URL || '(sin webhook público)',
    notificationUrl: env.NOTIFICATION_URL || '(derivada de BACKEND_URL si existe)',
    firebaseAdmin: Boolean(process.env['FIREBASE_PROJECT_ID']),
    tokenHint,
  });
  if (env.IS_DEV && !env.BACKEND_URL && !env.NOTIFICATION_URL) {
    console.warn(
      '[Derma MercadoPago] Sin BACKEND_URL/NOTIFICATION_URL: el QR se crea, pero MP no notificará pagos hasta exponer el webhook (ej. ngrok http 3001).',
    );
  }

  if (env.BACKEND_URL && env.NOTIFICATION_URL) {
    try {
      const backendHost = new URL(env.BACKEND_URL).host;
      const notificationHost = new URL(env.NOTIFICATION_URL).host;
      if (backendHost !== notificationHost) {
        console.warn(
          '[Derma MercadoPago] BACKEND_URL y NOTIFICATION_URL usan hosts distintos.',
          { backendHost, notificationHost },
        );
      }
    } catch {
      console.warn('[Derma MercadoPago] BACKEND_URL o NOTIFICATION_URL no son URLs válidas.');
    }
  }
}

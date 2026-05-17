export const env = {
  get googleClientId()     { return requireEnv('GOOGLE_CLIENT_ID'); },
  get googleClientSecret() { return requireEnv('GOOGLE_CLIENT_SECRET'); },
  get googleRedirectUri()  { return requireEnv('GOOGLE_REDIRECT_URI'); },
  get encryptionKey()      { return requireEnv('ENCRYPTION_KEY'); },
  get frontendUrl()        { return process.env['FRONTEND_URL'] ?? 'http://localhost:4200'; },
  get whatsappBackendUrl() { return process.env['WHATSAPP_BACKEND_URL'] ?? 'http://localhost:3001'; },
  port: process.env['GOOGLE_CALENDAR_PORT'] ?? '3002',
} as const;

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) throw new Error(`Variable de entorno faltante: ${key}`);
  return value;
}

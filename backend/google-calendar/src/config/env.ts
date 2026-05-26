/** Rango válido Calendar API (~4 semanas). Sin valor o inválido → default. */
function reminderMinutes(raw: string | undefined, fallback: number): number {
  if (raw == null || raw.trim() === '') return fallback;
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n) || n < 1) return fallback;
  return Math.min(n, 40320);
}

export const env = {
  get googleClientId()     { return requireEnv('GOOGLE_CLIENT_ID'); },
  get googleClientSecret() { return requireEnv('GOOGLE_CLIENT_SECRET'); },
  get googleRedirectUri()  { return requireEnv('GOOGLE_REDIRECT_URI'); },
  get encryptionKey()      { return requireEnv('ENCRYPTION_KEY'); },
  get frontendUrl()        { return process.env['FRONTEND_URL'] ?? 'http://localhost:4200'; },
  get whatsappBackendUrl() { return process.env['WHATSAPP_BACKEND_URL'] ?? 'http://localhost:3001'; },
  port: process.env['GOOGLE_CALENDAR_PORT'] ?? '3002',

  /** Defaults 60 si no definís `CALENDAR_REMINDER_EMAIL_MINUTES`. */
  get calendarReminderEmailMinutes(): number {
    return reminderMinutes(process.env['CALENDAR_REMINDER_EMAIL_MINUTES'], 60);
  },
  /** Defaults 15 si no definís `CALENDAR_REMINDER_POPUP_MINUTES`. */
  get calendarReminderPopupMinutes(): number {
    return reminderMinutes(process.env['CALENDAR_REMINDER_POPUP_MINUTES'], 15);
  },
} as const;

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) throw new Error(`Variable de entorno faltante: ${key}`);
  return value;
}

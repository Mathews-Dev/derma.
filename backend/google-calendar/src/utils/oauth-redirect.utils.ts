import { env } from '../config/env';

export type GoogleCalendarAuthStatus = 'conectado' | 'error';

/** Extrae el uid del parámetro `state` (uid plano o base64url legacy del modo popup). */
export function parseProfesionalUidFromState(raw: string | undefined): string | null {
  if (!raw?.trim()) return null;

  const trimmed = raw.trim();
  try {
    const json = Buffer.from(trimmed, 'base64url').toString('utf8');
    const parsed = JSON.parse(json) as { uid?: string };
    if (typeof parsed.uid === 'string' && parsed.uid.length > 0) {
      return parsed.uid;
    }
  } catch {
    // state plano (formato actual)
  }

  if (/^[a-zA-Z0-9_-]+$/.test(trimmed)) {
    return trimmed;
  }

  return null;
}

export function redirectUrlPerfilGoogle(
  status: GoogleCalendarAuthStatus,
  message?: string,
): string {
  const base = `${env.frontendUrl.replace(/\/$/, '')}/admin/perfil/profesional`;
  const params = new URLSearchParams({ google: status, tab: 'integraciones' });
  if (message) params.set('message', message);
  return `${base}?${params.toString()}`;
}

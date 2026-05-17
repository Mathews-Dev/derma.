import { google } from 'googleapis';
import { env } from '../config/env';
import { guardarTokenGoogleEnFirestore } from './profesional.service';

function crearClienteOAuth() {
  return new google.auth.OAuth2(
    env.googleClientId,
    env.googleClientSecret,
    env.googleRedirectUri,
  );
}

export function generarUrlDeAutorizacion(profesionalUid: string): string {
  const clienteOAuth = crearClienteOAuth();

  return clienteOAuth.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: [
      'https://www.googleapis.com/auth/calendar.events',
      'https://www.googleapis.com/auth/userinfo.email',
    ],
    state: profesionalUid,
  });
}

export async function procesarCallbackDeGoogle(
  codigoDeAutorizacion: string,
  profesionalUid: string,
): Promise<void> {
  const clienteOAuth = crearClienteOAuth();

  const { tokens } = await clienteOAuth.getToken(codigoDeAutorizacion);

  if (!tokens.refresh_token) {
    throw new Error('Google no devolvió refresh_token. Revocá el acceso y volvé a conectar.');
  }

  clienteOAuth.setCredentials(tokens);

  if (!tokens.access_token && tokens.refresh_token) {
    const { credentials } = await clienteOAuth.refreshAccessToken();
    clienteOAuth.setCredentials(credentials);
  }

  let emailGoogle = '';
  try {
    const { data: infoUsuario } = await google
      .oauth2({ version: 'v2', auth: clienteOAuth })
      .userinfo.get();
    emailGoogle = infoUsuario.email ?? '';
  } catch (err) {
    console.warn('[auth] No se pudo leer userinfo; se guarda conexión sin email:', err);
  }

  await guardarTokenGoogleEnFirestore(
    profesionalUid,
    tokens.refresh_token,
    emailGoogle,
  );
}

/** Genera un token URL-safe para links de portal paciente. */
export function generateTurnoAccessToken(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
}

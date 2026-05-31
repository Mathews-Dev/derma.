/** Extrae el código de sala (abc-defg-hij) desde la URL de Google Meet. */
export function extractMeetCode(meetLink: string | null | undefined): string | null {
  if (!meetLink?.trim()) return null;

  try {
    const pathname = new URL(meetLink.trim()).pathname;
    const code = pathname.replace(/^\//, '').split('/')[0];
    return code || null;
  } catch {
    const match = meetLink.match(/meet\.google\.com\/([a-z]{3}-[a-z]{4}-[a-z]{3})/i);
    return match ? match[1] : null;
  }
}

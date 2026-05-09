export function sanitizeUrl(url: string | undefined): string | null {
  if (!url) return null;
  let cleanUrl = url.trim();
  if (cleanUrl.endsWith('/')) {
    cleanUrl = cleanUrl.slice(0, -1);
  }
  return cleanUrl;
}

export function isPublicHttpUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  return url.startsWith('https://') || (url.startsWith('http://') && !url.includes('localhost'));
}

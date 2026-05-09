export function sanitizeUrl(urlValue) {
  if (!urlValue) return '';
  return urlValue.trim().replace(/^['"`\s]+|['"`\s]+$/g, '').replace(/\/$/, '');
}

export function isPublicHttpUrl(urlValue) {
  try {
    const parsedUrl = new URL(urlValue);
    const isHttpProtocol = parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:';
    const isLocal = parsedUrl.hostname === 'localhost' || parsedUrl.hostname === '127.0.0.1';
    return isHttpProtocol && !isLocal;
  } catch {
    return false;
  }
}

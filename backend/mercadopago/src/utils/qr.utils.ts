import QRCode from 'qrcode';

export async function generateQRBase64(text: string | null | undefined): Promise<string | null> {
  if (!text) return null;
  try {
    return await QRCode.toDataURL(text);
  } catch (error: any) {
    console.error('[QR] Error:', error.message);
    return null;
  }
}

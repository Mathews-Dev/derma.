import QRCode from 'qrcode';

export async function generateQRBase64(url) {
  return QRCode.toDataURL(url);
}

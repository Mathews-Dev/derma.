/**
 * Meta requiere formato E.164 sin el '+':
 * Argentina móvil: 549 + número sin 0 ni 15
 * Ejemplo: 3884123456 → 5493884123456
 */
export function formatPhoneAR(phone: string): string {
  const digits = phone.replace(/\D/g, '');

  if (digits.startsWith('549') && digits.length === 13) return digits;
  if (digits.startsWith('54')  && digits.length === 12) return '549' + digits.slice(2);
  if (digits.startsWith('0')   && digits.length === 10) return '549' + digits.slice(1);
  if (digits.startsWith('15')  && digits.length === 10) return '549' + digits.slice(2);
  if (digits.length === 10)                              return '549' + digits;

  throw new Error(`Número de teléfono inválido: ${phone}`);
}
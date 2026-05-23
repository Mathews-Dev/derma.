import { getPhoneCountryByIso, PHONE_COUNTRIES, type PhoneCountry } from './phone-countries';

/** Separa código de país y número local a partir de un teléfono guardado (E.164 o similar). */
export function parsePhoneNumber(full: string): { country: PhoneCountry; local: string } {
  const t = full.replace(/\s/g, '');
  if (!t) {
    return { country: PHONE_COUNTRIES[0], local: '' };
  }

  const byDial = [...PHONE_COUNTRIES].sort(
    (a, b) => b.dialCode.length - a.dialCode.length
  );

  for (const country of byDial) {
    const dialDigits = country.dialCode.replace('+', '');
    if (t.startsWith(country.dialCode) || t.startsWith(dialDigits)) {
      let local = t.startsWith(country.dialCode)
        ? t.slice(country.dialCode.length)
        : t.slice(dialDigits.length);
      if (country.isoCode === 'AR' && local.startsWith('9')) {
        local = local.slice(1);
      }
      return { country, local };
    }
  }

  if (t.startsWith('+')) {
    return { country: PHONE_COUNTRIES[0], local: t.replace(/^\+\d{1,4}/, '') };
  }

  return { country: PHONE_COUNTRIES[0], local: t };
}

/** Formatea número local + país (Argentina agrega 9 móvil tras +54). */
export function formatPhoneNumber(country: PhoneCountry, local: string): string {
  const digits = local.replace(/\s/g, '').replace(/\D/g, '');
  if (!digits) return '';

  if (country.isoCode === 'AR') {
    const withoutNine = digits.startsWith('9') ? digits.slice(1) : digits;
    return `${country.dialCode}9${withoutNine}`;
  }

  return `${country.dialCode}${digits}`;
}

export function formatPhoneNumberByIso(isoCode: string, local: string): string {
  return formatPhoneNumber(getPhoneCountryByIso(isoCode), local);
}

export function isValidLocalPhone(local: string, minDigits = 6): boolean {
  return local.replace(/\D/g, '').length >= minDigits;
}

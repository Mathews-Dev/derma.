import type { SelectOption } from '../dropdown-select/dropdown-select';

/** Ruta base servida por derma-admin y derma-patients (`libs/ui/src/assets` → `/assets`). */
export const COUNTRY_FLAGS_ASSET_PATH = '/assets/flags';

export interface PhoneCountry {
  isoCode: string;
  name: string;
  dialCode: string;
  flagUrl: string;
}

/** URL de bandera local (ISO 3166-1 alpha-2, p. ej. `AR` → `/assets/flags/ar.webp`). */
export function countryFlagUrl(isoCode: string): string {
  return `${COUNTRY_FLAGS_ASSET_PATH}/${isoCode.toLowerCase()}.webp`;
}

/** Países soportados para teléfono (registro, turnos, notificaciones). */
export const PHONE_COUNTRIES: PhoneCountry[] = [
  { isoCode: 'AR', name: 'Argentina', dialCode: '+54', flagUrl: countryFlagUrl('AR') },
  { isoCode: 'UY', name: 'Uruguay', dialCode: '+598', flagUrl: countryFlagUrl('UY') },
  { isoCode: 'BR', name: 'Brasil', dialCode: '+55', flagUrl: countryFlagUrl('BR') },
  { isoCode: 'CL', name: 'Chile', dialCode: '+56', flagUrl: countryFlagUrl('CL') },
  { isoCode: 'CO', name: 'Colombia', dialCode: '+57', flagUrl: countryFlagUrl('CO') },
  { isoCode: 'PE', name: 'Perú', dialCode: '+51', flagUrl: countryFlagUrl('PE') },
  { isoCode: 'MX', name: 'México', dialCode: '+52', flagUrl: countryFlagUrl('MX') },
  { isoCode: 'EC', name: 'Ecuador', dialCode: '+593', flagUrl: countryFlagUrl('EC') },
  { isoCode: 'VE', name: 'Venezuela', dialCode: '+58', flagUrl: countryFlagUrl('VE') },
  { isoCode: 'BO', name: 'Bolivia', dialCode: '+591', flagUrl: countryFlagUrl('BO') },
  { isoCode: 'PY', name: 'Paraguay', dialCode: '+595', flagUrl: countryFlagUrl('PY') },
  { isoCode: 'CR', name: 'Costa Rica', dialCode: '+506', flagUrl: countryFlagUrl('CR') },
  { isoCode: 'PA', name: 'Panamá', dialCode: '+507', flagUrl: countryFlagUrl('PA') },
  { isoCode: 'DO', name: 'Rep. Dominicana', dialCode: '+1-809', flagUrl: countryFlagUrl('DO') },
  { isoCode: 'GT', name: 'Guatemala', dialCode: '+502', flagUrl: countryFlagUrl('GT') },
  { isoCode: 'HN', name: 'Honduras', dialCode: '+504', flagUrl: countryFlagUrl('HN') },
  { isoCode: 'SV', name: 'El Salvador', dialCode: '+503', flagUrl: countryFlagUrl('SV') },
  { isoCode: 'NI', name: 'Nicaragua', dialCode: '+505', flagUrl: countryFlagUrl('NI') },
  { isoCode: 'CU', name: 'Cuba', dialCode: '+53', flagUrl: countryFlagUrl('CU') },
  { isoCode: 'ES', name: 'España', dialCode: '+34', flagUrl: countryFlagUrl('ES') },
  { isoCode: 'PR', name: 'Puerto Rico', dialCode: '+1-939', flagUrl: countryFlagUrl('PR') },
];

export function getPhoneCountryByIso(isoCode: string): PhoneCountry {
  return PHONE_COUNTRIES.find(c => c.isoCode === isoCode) ?? PHONE_COUNTRIES[0];
}

export function phoneCountrySelectOptions(): SelectOption[] {
  return PHONE_COUNTRIES.map(c => ({
    id: c.isoCode,
    label: `${c.dialCode} ${c.name}`,
  }));
}
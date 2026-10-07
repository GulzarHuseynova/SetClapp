import type { CountryPhoneOption } from '../types/phone.type';
import { buildCountryPhoneOptions } from './country-calling-codes';

export const DEFAULT_PHONE_COUNTRY_CODE = '+994';

// Bütün ölkələrin zəng kodları (ölkə adları və bayraqlar ISO koddan yaradılır).
export const COUNTRY_PHONE_OPTIONS: CountryPhoneOption[] = buildCountryPhoneOptions();

const cleanPhoneDigits = (value?: string | null) => String(value || '').replace(/\D/g, '');

const normalizePrefix = (value?: string | null) => {
  const text = String(value || '').trim();

  if (!text) return '';
  if (text.startsWith('+')) return `+${cleanPhoneDigits(text)}`;
  if (text.startsWith('00')) return `+${cleanPhoneDigits(text).slice(2)}`;

  return text;
};

export const splitPhoneByCountryCode = (value?: string | null, fallbackCode = DEFAULT_PHONE_COUNTRY_CODE) => {
  const normalized = normalizePrefix(value);

  if (!normalized) {
    return { countryCode: fallbackCode, nationalNumber: '' };
  }

  if (normalized.startsWith('+')) {
    const matchedOption = [...COUNTRY_PHONE_OPTIONS]
      .sort((left, right) => right.value.length - left.value.length)
      .find((option) => normalized.startsWith(option.value));

    if (matchedOption) {
      return {
        countryCode: matchedOption.value,
        nationalNumber: cleanPhoneDigits(normalized.slice(matchedOption.value.length)),
      };
    }

    return { countryCode: fallbackCode, nationalNumber: cleanPhoneDigits(normalized) };
  }

  const digits = cleanPhoneDigits(normalized);
  const nationalNumber = fallbackCode === DEFAULT_PHONE_COUNTRY_CODE && digits.startsWith('0')
    ? digits.slice(1)
    : digits;

  return { countryCode: fallbackCode, nationalNumber };
};

export const joinPhoneWithCountryCode = (countryCode: string, nationalNumber?: string | null) => {
  const digits = cleanPhoneDigits(nationalNumber);

  if (!digits) return '';

  const safeCountryCode = countryCode.startsWith('+') ? countryCode : `+${cleanPhoneDigits(countryCode)}`;
  const normalizedDigits = safeCountryCode === DEFAULT_PHONE_COUNTRY_CODE && digits.startsWith('0')
    ? digits.slice(1)
    : digits;

  return `${safeCountryCode}${normalizedDigits}`;
};

export const normalizePhoneForInput = (value?: string | null, fallbackCode = DEFAULT_PHONE_COUNTRY_CODE) => {
  const { countryCode, nationalNumber } = splitPhoneByCountryCode(value, fallbackCode);
  return joinPhoneWithCountryCode(countryCode, nationalNumber);
};

export const normalizePhoneForBackend = (value?: string | null) => normalizePhoneForInput(value) || '';

// Saxlanmış əlaqə linkindən ("tel:+994..." və ya "https://wa.me/994...") nömrəni çıxarır; nömrə sahəsi üçündür.
export const phoneFromContactLink = (value?: string | null) => {
  const text = String(value || '').trim();
  if (!text) return '';

  const whatsappDigits = /wa\.me\/\+?(\d+)/i.exec(text)?.[1];
  return normalizePhoneForInput(whatsappDigits ? `+${whatsappDigits}` : text.replace(/^tel:/i, ''));
};

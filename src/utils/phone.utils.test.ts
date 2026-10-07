import { describe, expect, it } from 'vitest';
import { normalizeCountrySearch } from './country-calling-codes';
import {
  COUNTRY_PHONE_OPTIONS,
  joinPhoneWithCountryCode,
  phoneFromContactLink,
  splitPhoneByCountryCode,
} from './phone.utils';

describe('country phone options', () => {
  it('covers all countries with one option per calling code', () => {
    const values = COUNTRY_PHONE_OPTIONS.map((option) => option.value);

    expect(values.length).toBeGreaterThan(150);
    expect(new Set(values).size).toBe(values.length);
    ['+994', '+90', '+49', '+55', '+81', '+971', '+1', '+7'].forEach((code) => expect(values).toContain(code));
  });

  it('lists the frequently used countries first and shows the main country of a shared code', () => {
    expect(COUNTRY_PHONE_OPTIONS[0]).toMatchObject({ country: 'AZ', value: '+994', name: 'Azərbaycan' });
    expect(COUNTRY_PHONE_OPTIONS.find((option) => option.value === '+1')?.country).toBe('US');
    expect(COUNTRY_PHONE_OPTIONS.find((option) => option.value === '+7')?.country).toBe('RU');
  });

  it('finds a country by its Azerbaijani name regardless of letter case and diacritics', () => {
    const matches = (query: string) => COUNTRY_PHONE_OPTIONS
      .filter((option) => option.searchText.includes(normalizeCountrySearch(query)))
      .map((option) => option.value);

    expect(matches('alma')).toContain('+49');
    expect(matches('TÜRKİYƏ')).toContain('+90');
    expect(matches('turkiye')).toContain('+90');
    expect(matches('braz')).toContain('+55');
    // Eyni kodu paylaşan ölkələr (Yamayka +1) də həmin kodla tapılır.
    expect(matches('yamayka')).toContain('+1');
  });
});

describe('splitPhoneByCountryCode with all countries', () => {
  it.each([
    ['+5511987654321', '+55', '11987654321'],
    ['+491701234567', '+49', '1701234567'],
    ['+12125551234', '+1', '2125551234'],
    ['+79161234567', '+7', '9161234567'],
    ['+994501112233', '+994', '501112233'],
    ['00905321112233', '+90', '5321112233'],
  ])('splits %s', (phone, countryCode, nationalNumber) => {
    expect(splitPhoneByCountryCode(phone)).toEqual({ countryCode, nationalNumber });
  });

  it('joins the selected country code and number back without losing the plus sign', () => {
    expect(joinPhoneWithCountryCode('+55', '11987654321')).toBe('+5511987654321');
  });
});

describe('phoneFromContactLink', () => {
  it.each([
    ['tel:+905321112233', '+905321112233'],
    ['https://wa.me/5511987654321', '+5511987654321'],
    ['+994501112233', '+994501112233'],
    ['', ''],
  ])('turns %s into a phone number', (link, phone) => {
    expect(phoneFromContactLink(link)).toBe(phone);
  });
});

import { describe, expect, it } from 'vitest';
import { DEFAULT_BRAND_COLOR } from '../constants/colors';
import { hexToHsl, isFamilyColor, normalizeHex, recolor, resolveBrandPrimary } from './brand-color';

describe('brand-color', () => {
  it('normalizes hex input', () => {
    expect(normalizeHex('#ABC')).toBe('#aabbcc');
    expect(normalizeHex(' #185582 ')).toBe('#185582');
    expect(normalizeHex('red')).toBeNull();
    expect(normalizeHex(null)).toBeNull();
  });

  it('keeps the default palette unchanged when the default brand is selected', () => {
    for (const hex of ['#185582', '#12466c', '#e7f0f8', '#d8edf9', '#456b82']) {
      expect(recolor(hex, DEFAULT_BRAND_COLOR, 'light')).toBe(hex);
    }
  });

  it('leaves non-brand colors (grays, greens, reds) untouched', () => {
    for (const hex of ['#ffffff', '#e9eceb', '#dc2626', '#16a34a', '#6e7671']) {
      expect(isFamilyColor(hex)).toBe(false);
      expect(recolor(hex, '#15803d', 'light')).toBe(hex);
    }
  });

  it('turns the primary into the chosen color and shifts tints to the same hue', () => {
    expect(recolor('#185582', '#15803d', 'light')).toBe('#15803d');
    const [tintHue] = hexToHsl(recolor('#e7f0f8', '#15803d', 'light'));
    const [chosenHue] = hexToHsl('#15803d');
    expect(Math.abs(tintHue - chosenHue)).toBeLessThan(25);
  });

  it('darkens colors that are too light for white button text', () => {
    const [, , lightness] = hexToHsl(resolveBrandPrimary('#fde047'));
    expect(lightness).toBeLessThanOrEqual(0.47);
  });
});

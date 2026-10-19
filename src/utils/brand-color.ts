

import { BRAND_DARK_BASE_COLOR, DEFAULT_BRAND_COLOR } from '../constants/colors';

const HEX_RE = /^#[0-9a-f]{6}$/i;

const FAMILY_HUE_MIN = 180;
const FAMILY_HUE_MAX = 245;
const FAMILY_MIN_SATURATION = 0.2;

const MAX_LIGHT_LIGHTNESS = 0.46;
const MIN_DARK_LIGHTNESS = 0.4;

type Hsl = [number, number, number];

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export const normalizeHex = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  const expanded = /^#[0-9a-f]{3}$/i.test(trimmed)
    ? `#${trimmed.slice(1).split('').map((char) => char + char).join('')}`
    : trimmed;
  return HEX_RE.test(expanded) ? expanded.toLowerCase() : null;
};

export const hexToHsl = (hex: string): Hsl => {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  if (d === 0) return [0, 0, l];
  const s = d / (1 - Math.abs(2 * l - 1));
  let h: number;
  if (max === r) h = ((g - b) / d) % 6;
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  return [(h * 60 + 360) % 360, s, l];
};

const hslToHex = ([h, s, l]: Hsl): string => {
  const hue = ((h % 360) + 360) % 360;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((hue / 60) % 2) - 1));
  const m = l - c / 2;
  const [r, g, b] =
    hue < 60 ? [c, x, 0] : hue < 120 ? [x, c, 0] : hue < 180 ? [0, c, x] : hue < 240 ? [0, x, c] : hue < 300 ? [x, 0, c] : [c, 0, x];
  const toHex = (channel: number) => Math.round(clamp(channel + m, 0, 1) * 255).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

const BASE_LIGHT = hexToHsl(DEFAULT_BRAND_COLOR);

const BASE_DARK = hexToHsl(BRAND_DARK_BASE_COLOR);

export const isFamilyColor = (hex: string) => {
  const [h, s] = hexToHsl(hex);
  return h >= FAMILY_HUE_MIN && h <= FAMILY_HUE_MAX && s >= FAMILY_MIN_SATURATION;
};


export const resolveBrandPrimary = (color: string): string => {
  const [h, s, l] = hexToHsl(color);
  return hslToHex([h, s, Math.min(l, MAX_LIGHT_LIGHTNESS)]);
};


export const resolveBrandPrimaryDark = (color: string): string => {
  const [h, s, l] = hexToHsl(color);
  return hslToHex([h, s, clamp(l + 0.06, MIN_DARK_LIGHTNESS, 0.6)]);
};


export const recolor = (hex: string, brand: string, mode: 'light' | 'dark'): string => {
  const source = normalizeHex(hex);
  if (!source || !isFamilyColor(source) || normalizeHex(brand) === DEFAULT_BRAND_COLOR) return hex;

  const [targetH, targetS, targetL] = hexToHsl(brand);
  const base = mode === 'dark' ? BASE_DARK : BASE_LIGHT;
  const wantedL = mode === 'dark' ? clamp(targetL + 0.06, MIN_DARK_LIGHTNESS, 0.6) : Math.min(targetL, MAX_LIGHT_LIGHTNESS);
  const [h, s, l] = hexToHsl(source);
  
  const weight = mode === 'dark' && l < 0.3 ? 0 : clamp((1 - l) / (1 - base[2]), 0, 1);
  const satRatio = base[1] > 0 ? targetS / base[1] : 1;

  return hslToHex([
    targetH + (h - base[0]),
    clamp(s * satRatio * (mode === 'dark' && l < 0.3 ? 0.45 : 1), 0, 1),
    clamp(l + (wantedL - base[2]) * weight, 0.02, 0.98),
  ]);
};





export const DEFAULT_BRAND_COLOR = '#185582';
export const BRAND_HOVER_COLOR = '#12466c';

export const BRAND_DARK_BASE_COLOR = '#1d669c';
export const BRAND_DARK_LINK_COLOR = '#6fb1e3';
export const BRAND_DARK_LINK_HOVER_COLOR = '#9ccbee';


export const BRAND_PRESETS = [
  { name: 'Standart',   light: DEFAULT_BRAND_COLOR, dark: '#2a76ab' },
  { name: 'Mavi',       light: '#1d4ed8',           dark: '#4b72ee' },
  { name: 'Firuzəyi',   light: '#0f766e',           dark: '#1da89d' },
  { name: 'Yaşıl',      light: '#15803d',           dark: '#1ea855' },
  { name: 'Bənövşəyi',  light: '#6d28d9',           dark: '#9b5cf5' },
  { name: 'Çəhrayı',    light: '#be185d',           dark: '#e04f8a' },
  { name: 'Qırmızı',    light: '#b91c1c',           dark: '#e05050' },
  { name: 'Narıncı',    light: '#c2410c',           dark: '#e8663c' },
  { name: 'Qəhvəyi',    light: '#92400e',           dark: '#c0692a' },
  { name: 'Qara-boz',   light: '#334155',           dark: '#6b8198' },
] as const;


export const DARK_PALETTE = {
  bg: '#0f141a',
  surface: '#171e27',
  elevated: '#1d2631',
  border: '#2f3b49',
  borderSoft: '#27323f',
  text: '#e6edf3',
  primary: '#2a76ab',
} as const;

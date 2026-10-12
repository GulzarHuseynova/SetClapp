// Layihənin əsas rəngləri üçün TƏK mənbə. Başqa yerdə (TS) #185582 kimi brend rəngi yazmayın.
// CSS-də rənglər src/styles/theme-colors.css (generasiya olunmuş --bg/--fg/--bd-*) və
// src/styles/tokens.css (--pro-*, --ca-*, --brand-sky-*, --login-*, --dark-*) faylındadır.

/** Standart (şirkət rəng seçməyibsə) əsas brend rəngi. */
export const DEFAULT_BRAND_COLOR = '#185582';
export const BRAND_HOVER_COLOR = '#12466c';
/** Tünd rejimdə --color-primary dəyişəninin dəyəri (src/styles/theme-colors.css). */
export const BRAND_DARK_BASE_COLOR = '#1d669c';
export const BRAND_DARK_LINK_COLOR = '#6fb1e3';
export const BRAND_DARK_LINK_HOVER_COLOR = '#9ccbee';

/**
 * Tənzimləmələr səhifəsindəki hazır rənglər.
 * `light` — kanonik (açıq rejim) rəngi; brandStore həmişə bunu saxlayır.
 * `dark`  — tünd rejimdə swatch arxa planı üçün açıq variant (hesablanmır, açıq yazılıb).
 */
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

/**
 * Tünd rejim paleti. antd tokenləri buradan götürülür; CSS-də eyni dəyərlər tokens.css-dəki
 * --dark-* dəyişənləridir (src/constants/colors.test.ts ikisinin eyni qalmasını yoxlayır).
 */
export const DARK_PALETTE = {
  bg: '#0f141a',
  surface: '#171e27',
  elevated: '#1d2631',
  border: '#2f3b49',
  borderSoft: '#27323f',
  text: '#e6edf3',
  primary: '#2a76ab',
} as const;

import type { ThemeConfig } from 'antd';

export const BRAND_COLOR = '#185582';
export const BRAND_COLOR_HOVER = '#12466c';
export const BRAND_TINT = '#e7f0f8';

// Super Admin və Employee panellərində antd komponentləri standart açıq mavi əvəzinə brend rəngini istifadə edir.
export const BRAND_THEME: ThemeConfig = {
  token: {
    colorPrimary: BRAND_COLOR,
    colorInfo: BRAND_COLOR,
    colorLink: BRAND_COLOR,
    colorLinkHover: BRAND_COLOR_HOVER,
  },
};

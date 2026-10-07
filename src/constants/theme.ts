import type { ThemeConfig } from 'antd';

export const BRAND_COLOR = '#185582';
export const BRAND_COLOR_HOVER = '#12466c';

export const BRAND_THEME: ThemeConfig = {
  token: {
    colorPrimary: BRAND_COLOR,
    colorInfo: BRAND_COLOR,
    colorLink: BRAND_COLOR,
    colorLinkHover: BRAND_COLOR_HOVER,
  },
};

// Tünd rejim: antd tokenləri (src/styles/theme-colors.css-dəki tünd palitra ilə uyğundur)
export const DARK_TOKENS: ThemeConfig['token'] = {
  colorBgBase: '#171e27',
  colorBgContainer: '#171e27',
  colorBgElevated: '#1d2631',
  colorBgLayout: '#0f141a',
  colorBorder: '#2f3b49',
  colorBorderSecondary: '#27323f',
  colorText: '#e6edf3',
  colorTextBase: '#e6edf3',
  colorPrimary: '#2a76ab',
  colorInfo: '#2a76ab',
  colorLink: '#6fb1e3',
  colorLinkHover: '#9ccbee',
};

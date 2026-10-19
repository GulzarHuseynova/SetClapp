import type { ThemeConfig } from 'antd';
import {
  BRAND_DARK_LINK_COLOR,
  BRAND_DARK_LINK_HOVER_COLOR,
  BRAND_HOVER_COLOR,
  DARK_PALETTE,
  DEFAULT_BRAND_COLOR,
} from './colors';


export const BRAND_COLOR_VAR = 'var(--color-primary)';

export const BRAND_THEME: ThemeConfig = {
  token: {
    colorPrimary: DEFAULT_BRAND_COLOR,
    colorInfo: DEFAULT_BRAND_COLOR,
    colorLink: DEFAULT_BRAND_COLOR,
    colorLinkHover: BRAND_HOVER_COLOR,
  },
};


export const DARK_TOKENS: ThemeConfig['token'] = {
  colorBgBase: DARK_PALETTE.surface,
  colorBgContainer: DARK_PALETTE.surface,
  colorBgElevated: DARK_PALETTE.elevated,
  colorBgLayout: DARK_PALETTE.bg,
  colorBorder: DARK_PALETTE.border,
  colorBorderSecondary: DARK_PALETTE.borderSoft,
  colorText: DARK_PALETTE.text,
  colorTextBase: DARK_PALETTE.text,
  colorPrimary: DARK_PALETTE.primary,
  colorInfo: DARK_PALETTE.primary,
  colorLink: BRAND_DARK_LINK_COLOR,
  colorLinkHover: BRAND_DARK_LINK_HOVER_COLOR,
};

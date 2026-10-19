import { useEffect, useMemo } from 'react';
import { App, ConfigProvider, theme as antdTheme } from 'antd';
import type { ThemeConfig } from 'antd';
import { registerAntdApp } from '../utils/antd-static';
import { BRAND_THEME, DARK_TOKENS } from '../constants/theme';
import { useResolvedTheme } from '../store/themeStore';
import { useBrandColor } from '../store/brandStore';
import { BRAND_DARK_LINK_COLOR, BRAND_DARK_LINK_HOVER_COLOR, BRAND_HOVER_COLOR, DEFAULT_BRAND_COLOR } from '../constants/colors';
import { recolor, resolveBrandPrimary, resolveBrandPrimaryDark } from '../utils/brand-color';
import type { AntdAppProviderProps } from '../types/ui.type';

function AntdAppRegistration() {
  const { message, modal } = App.useApp();

  useEffect(() => registerAntdApp({ message, modal }), [message, modal]);

  return null;
}

export function AntdAppProvider({ brand, children }: AntdAppProviderProps) {
  const resolved = useResolvedTheme();

  const brandColor = useBrandColor();

  const themeConfig = useMemo<ThemeConfig | undefined>(() => {
    const dark = resolved === 'dark';
    
    const custom = brandColor !== DEFAULT_BRAND_COLOR;
    const primary = dark ? resolveBrandPrimaryDark(brandColor) : resolveBrandPrimary(brandColor);
    const customTokens: ThemeConfig['token'] = custom
      ? {
          colorPrimary: primary,
          colorInfo: primary,
          colorLink: dark ? recolor(BRAND_DARK_LINK_COLOR, brandColor, 'dark') : primary,
          colorLinkHover: recolor(dark ? BRAND_DARK_LINK_HOVER_COLOR : BRAND_HOVER_COLOR, brandColor, dark ? 'dark' : 'light'),
        }
      : {};

    if (dark) {
      return { algorithm: antdTheme.darkAlgorithm, token: { ...(brand ? BRAND_THEME.token : {}), ...DARK_TOKENS, ...customTokens } };
    }
    if (custom) return { token: { ...(brand ? BRAND_THEME.token : {}), ...customTokens } };
    return brand ? BRAND_THEME : undefined;
  }, [brand, brandColor, resolved]);

  const app = (
    <App className="antd-app-root">
      <AntdAppRegistration />
      {children}
    </App>
  );

  
  
  return <ConfigProvider theme={themeConfig ?? {}}>{app}</ConfigProvider>;
}

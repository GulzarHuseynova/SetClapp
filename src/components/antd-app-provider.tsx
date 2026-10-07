import { useEffect, useMemo } from 'react';
import { App, ConfigProvider, theme as antdTheme } from 'antd';
import type { ThemeConfig } from 'antd';
import { registerAntdApp } from '../utils/antd-static';
import { BRAND_THEME, DARK_TOKENS } from '../constants/theme';
import { useResolvedTheme } from '../store/themeStore';
import type { AntdAppProviderProps } from '../types/ui.type';

function AntdAppRegistration() {
  const { message, modal } = App.useApp();

  useEffect(() => registerAntdApp({ message, modal }), [message, modal]);

  return null;
}

export function AntdAppProvider({ brand, children }: AntdAppProviderProps) {
  const resolved = useResolvedTheme();

  const themeConfig = useMemo<ThemeConfig | undefined>(() => {
    if (resolved === 'dark') {
      return { algorithm: antdTheme.darkAlgorithm, token: { ...(brand ? BRAND_THEME.token : {}), ...DARK_TOKENS } };
    }
    return brand ? BRAND_THEME : undefined;
  }, [brand, resolved]);

  const app = (
    <App className="antd-app-root">
      <AntdAppRegistration />
      {children}
    </App>
  );

  return themeConfig ? <ConfigProvider theme={themeConfig}>{app}</ConfigProvider> : app;
}

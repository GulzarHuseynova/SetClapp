import { useEffect } from 'react';
import { App, ConfigProvider } from 'antd';
import { registerAntdApp } from '../utils/antd-static';
import type { AntdAppProviderProps } from '../types/ui.type';

function AntdAppRegistration() {
  const { message, modal } = App.useApp();

  useEffect(() => registerAntdApp({ message, modal }), [message, modal]);

  return null;
}

export function AntdAppProvider({ theme, children }: AntdAppProviderProps) {
  const app = (
    <App className="antd-app-root">
      <AntdAppRegistration />
      {children}
    </App>
  );

  return theme ? <ConfigProvider theme={theme}>{app}</ConfigProvider> : app;
}

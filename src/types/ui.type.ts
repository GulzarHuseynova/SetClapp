import type { ReactNode } from 'react';
import type { ButtonProps, ThemeConfig } from 'antd';

export type AppButtonTone = 'primary' | 'secondary' | 'danger' | 'ghost';

export interface AppButtonProps extends Omit<ButtonProps, 'variant'> {
  appTone?: AppButtonTone;
}

export interface AntdAppProviderProps {
  theme?: ThemeConfig;
  children: ReactNode;
}

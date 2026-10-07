import type { ReactNode } from 'react';
import type { ButtonProps } from 'antd';

export type AppButtonTone = 'primary' | 'secondary' | 'muted' | 'danger' | 'ghost';

export interface AppButtonProps extends Omit<ButtonProps, 'variant'> {
  appTone?: AppButtonTone;
}

export interface AntdAppProviderProps {
  /** true olduqda #185582 brend tokenləri tətbiq olunur (Super Admin və Employee panelləri). */
  brand?: boolean;
  children: ReactNode;
}

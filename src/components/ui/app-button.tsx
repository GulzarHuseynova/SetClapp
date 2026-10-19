import { Button } from 'antd';
import type { AppButtonProps, AppButtonTone } from '../../types/ui.type';

const BASE_CLASSES =
  'inline-flex items-center justify-center font-semibold transition-colors duration-150';

const TONE_CLASSES: Record<AppButtonTone, string> = {
  primary:
    '!border-(color:--color-primary-border) !bg-(color:--color-primary) !text-white hover:!border-(color:--color-primary-hover-border) hover:!bg-(color:--color-primary-hover) focus:!border-(color:--color-primary-border) focus:!bg-(color:--color-primary)',
  secondary:
    '!border-(color:--color-primary-border) !bg-white !text-(color:--color-primary-text) hover:!border-(color:--color-primary-hover-border) hover:!text-(color:--fg-12466c)',
  
  muted:
    '!border-(color:--color-primary-border) !bg-white !text-(color:--color-action-text) hover:!border-(color:--color-primary-hover-border) hover:!text-(color:--fg-35566a)',
  danger:
    '!border-[#dc2626] !bg-white !text-[#dc2626] hover:!border-(color:--bd-b91c1c) hover:!bg-(color:--bg-fef2f2) hover:!text-(color:--fg-b91c1c)',
  ghost:
    '!border-transparent !bg-transparent !text-(color:--color-primary-text) hover:!bg-(color:--color-surface-tint) hover:!text-(color:--fg-12466c)',
};

const resolveTone = ({
  appTone,
  danger,
  type,
}: Pick<AppButtonProps, 'appTone' | 'danger' | 'type'>): AppButtonTone => {
  if (appTone) return appTone;
  if (danger) return 'danger';
  if (type === 'primary') return 'primary';
  if (type === 'text' || type === 'link') return 'ghost';
  return 'secondary';
};

export function AppButton({
  appTone,
  className = '',
  danger,
  type,
  shape,
  ...props
}: AppButtonProps) {
  const tone = resolveTone({ appTone, danger, type });
  const shapeClass = shape === 'circle' ? '!rounded-full' : '!rounded-[10px]';

  return (
    <Button
      {...props}
      type={type}
      danger={danger}
      shape={shape}
      className={`${BASE_CLASSES} ${shapeClass} ${TONE_CLASSES[tone]} ${className}`.trim()}
    />
  );
}

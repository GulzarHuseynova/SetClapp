import { Button, type ButtonProps } from 'antd';

export type AppButtonTone = 'primary' | 'secondary' | 'danger' | 'ghost';

export interface AppButtonProps extends Omit<ButtonProps, 'variant'> {
  appTone?: AppButtonTone;
}

const BASE_CLASSES =
  'inline-flex items-center justify-center font-semibold transition-colors duration-150';

const TONE_CLASSES: Record<AppButtonTone, string> = {
  primary:
    '!border-[#185582] !bg-[#185582] !text-white hover:!border-[#12466c] hover:!bg-[#12466c] focus:!border-[#185582] focus:!bg-[#185582]',
  secondary:
    '!border-[#185582] !bg-white !text-[#185582] hover:!border-[#12466c] hover:!text-[#12466c]',
  danger:
    '!border-[#dc2626] !bg-white !text-[#dc2626] hover:!border-[#b91c1c] hover:!bg-[#fff5f5] hover:!text-[#b91c1c]',
  ghost:
    '!border-transparent !bg-transparent !text-[#185582] hover:!bg-[#eef5fa] hover:!text-[#12466c]',
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

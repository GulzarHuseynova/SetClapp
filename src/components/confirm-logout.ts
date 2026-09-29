import { modal } from '../utils/antd-static';

export const confirmLogout = (onConfirm: () => void) => {
  modal.confirm({
    title: 'Çıxış etmək istəyirsiniz?',
    content: 'Sistemdən çıxış edəcəksiniz.',
    okText: 'Bəli',
    cancelText: 'Xeyr',
    okButtonProps: { danger: true },
    cancelButtonProps: { className: 'logout-cancel-button' },
    onOk: onConfirm,
  });
};

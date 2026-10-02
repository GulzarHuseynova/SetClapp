import { createElement } from 'react';
import { LogoutOutlined } from '@ant-design/icons';
import { modal } from '../utils/antd-static';

export const confirmLogout = (onConfirm: () => void) => {
  modal.confirm({
    className: 'logout-confirm-modal',
    centered: true,
    width: 400,
    icon: createElement(LogoutOutlined),
    title: 'Çıxış etmək istəyirsiniz?',
    content: 'Hesabınızdan çıxacaqsınız. Davam etmək üçün yenidən daxil olmalısınız.',
    okText: 'Bəli',
    cancelText: 'Xeyr',
    autoFocusButton: 'cancel',
    okButtonProps: { danger: true, className: 'logout-confirm-button' },
    cancelButtonProps: { className: 'logout-cancel-button' },
    onOk: onConfirm,
  });
};

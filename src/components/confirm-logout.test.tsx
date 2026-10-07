// @vitest-environment jsdom
import { Modal } from 'antd';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { confirmLogout } from './confirm-logout';
import { AntdAppProvider } from './antd-app-provider';

const findButton = async (text: string) => {
  await vi.waitFor(() => {
    if (!Array.from(document.querySelectorAll('button')).some((button) => button.textContent?.trim() === text)) {
      throw new Error(`${text} düyməsi render olunmayıb`);
    }
  });
  return Array.from(document.querySelectorAll('button')).find((button) => button.textContent?.trim() === text)!;
};

afterEach(() => {
  Modal.destroyAll();
  document.body.innerHTML = '';
});

describe('confirmLogout', () => {
  it('renders the "Xeyr" button with the brand style class and does not log out on cancel', async () => {
    const onConfirm = vi.fn();
    confirmLogout(onConfirm);

    const cancelButton = await findButton('Xeyr');
    expect(cancelButton.classList.contains('logout-cancel-button')).toBe(true);
    expect(cancelButton.closest('.ant-modal-confirm-btns')).not.toBeNull();

    cancelButton.click();
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('logs out when "Bəli" is clicked', async () => {
    const onConfirm = vi.fn();
    confirmLogout(onConfirm);

    (await findButton('Bəli')).click();
    await vi.waitFor(() => expect(onConfirm).toHaveBeenCalledTimes(1));
  });

  it('opens inside the themed antd App without the static-function warning', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    const root = createRoot(document.body.appendChild(document.createElement('div')));
    await act(async () => root.render(<AntdAppProvider brand><span /></AntdAppProvider>));

    await act(async () => confirmLogout(vi.fn()));

    expect((await findButton('Xeyr')).classList.contains('logout-cancel-button')).toBe(true);
    const warnings = consoleError.mock.calls.map((call) => String(call[0]));
    expect(warnings.some((text) => text.includes('Static function'))).toBe(false);

    await act(async () => root.unmount());
    consoleError.mockRestore();
  });
});

// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { MemoryRouter } from 'react-router';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { EmployeesTable } from './business-card-sections';
import { copyText } from '../../../../utils/clipboard.utils';
import type { BusinessCardTableRow, EmployeesTableProps } from '../../../../types/business-card.type';

beforeAll(() => {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
  window.matchMedia ??= (() => ({
    matches: false,
    addListener() {},
    removeListener() {},
    addEventListener() {},
    removeEventListener() {},
  })) as unknown as typeof window.matchMedia;
});

const employee = {
  __tableRowKey: 'row-1',
  id: '3f2a1c9e-8b7d-4e6f-9a0b-1c2d3e4f5a6b',
  firstName: 'Ayten',
  lastName: 'Agayeva',
  email: 'ayten@x.az',
  isActive: true,
} as unknown as BusinessCardTableRow;

let root: Root | null = null;

const renderTable = async (overrides: Partial<EmployeesTableProps>) => {
  const props = {
    employeeStatusTab: 'active',
    activeUsersCount: 1,
    archivedUsersCount: 0,
    tableRows: [employee],
    hasMore: false,
    onLoadMore: vi.fn(),
    company: { id: 'c1', name: 'Pasha Holding' },
    protectedAdminKeys: [],
    vcfLoadingId: null,
    onStatusTabChange: vi.fn(),
    onOpenEditUser: vi.fn(),
    onToggleUserStatus: vi.fn(),
    onToggleUserCanEdit: vi.fn(),
    onDownloadVcf: vi.fn(),
    onViewPublicCard: vi.fn(),
    onCopyPublicCardLink: vi.fn(),
    onOpenResetPassword: vi.fn(),
    ...overrides,
  } as unknown as EmployeesTableProps;

  root = createRoot(document.body.appendChild(document.createElement('div')));
  await act(async () => root!.render(<MemoryRouter><EmployeesTable {...props} /></MemoryRouter>));
};

const openMenu = async () => {
  const trigger = document.querySelector<HTMLButtonElement>('.employee-public-view-button');
  expect(trigger).not.toBeNull();
  await act(async () => trigger!.click());
  await act(async () => new Promise((resolve) => setTimeout(resolve, 50)));
};

const clickMenuItem = async (label: string) => {
  const item = Array.from(document.querySelectorAll<HTMLElement>('.ant-dropdown-menu-item'))
    .find((element) => element.textContent?.trim() === label);
  expect(item, `"${label}" menyuda olmalıdır`).toBeTruthy();
  await act(async () => item!.click());
};

afterEach(async () => {
  await act(async () => root?.unmount());
  root = null;
  document.body.innerHTML = '';
});

describe('employee card menu', () => {
  it('opens a menu with view and copy actions from the three-dot button', async () => {
    await renderTable({});
    expect(document.querySelector('.ant-dropdown-menu-item')).toBeNull();

    await openMenu();

    const labels = Array.from(document.querySelectorAll('.ant-dropdown-menu-item')).map((el) => el.textContent?.trim());
    expect(labels).toEqual(['Public card-a bax', 'Linki kopyala']);
  });

  it('copies the link without opening the public card', async () => {
    const onViewPublicCard = vi.fn();
    const onCopyPublicCardLink = vi.fn();
    await renderTable({ onViewPublicCard, onCopyPublicCardLink });

    await openMenu();
    await clickMenuItem('Linki kopyala');

    expect(onCopyPublicCardLink).toHaveBeenCalledWith(employee);
    expect(onViewPublicCard).not.toHaveBeenCalled();
  });

  it('still opens the public card from the menu', async () => {
    const onViewPublicCard = vi.fn();
    await renderTable({ onViewPublicCard });

    await openMenu();
    await clickMenuItem('Public card-a bax');

    expect(onViewPublicCard).toHaveBeenCalledWith(employee);
  });
});

describe('copyText', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('uses the clipboard API when available', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { clipboard: { writeText } });

    expect(await copyText('http://localhost:5173/card/1')).toBe(true);
    expect(writeText).toHaveBeenCalledWith('http://localhost:5173/card/1');
  });

  it('falls back to execCommand when the clipboard API is missing (plain http)', async () => {
    vi.stubGlobal('navigator', {});
    let copied = '';
    document.execCommand = vi.fn(() => {
      copied = (document.activeElement as HTMLTextAreaElement | null)?.value ?? '';
      return true;
    });

    expect(await copyText('http://example.com/card/1')).toBe(true);
    expect(copied).toBe('http://example.com/card/1');
    expect(document.querySelector('textarea')).toBeNull();
  });
});

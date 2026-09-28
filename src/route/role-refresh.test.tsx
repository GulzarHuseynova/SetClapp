// @vitest-environment jsdom
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

const jwt = (claims: Record<string, unknown>) => `e30.${btoa(JSON.stringify(claims)).replace(/=+$/, '')}.sig`;
const ROLE_CLAIM = 'http://schemas.microsoft.com/ws/2008/06/identity/claims/role';

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

afterEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  document.body.innerHTML = '';
});

// login.tsx-in etdiyi kimi employee sessiyası yaradılır.
const loginAsEmployee = async (roleClaim: unknown) => {
  vi.resetModules();
  const token = jwt({ sub: 'e1', CompanyVoen: '123', [ROLE_CLAIM]: roleClaim });
  localStorage.setItem('token', token);
  const { authActions } = await import('../store/authStore');
  authActions.setSession({
    accessToken: token,
    role: 'employee',
    companyId: 'c1',
    userId: 'e1',
    companyVoen: '123',
    accountInfo: { id: 'e1', role: 'employee', email: 'e@x.az' },
  });
};

// Səhifənin yenilənməsi: modullar sıfırdan yüklənir, storage-lər qalır, backend əlçatmazdır.
const reloadAt = async (path: string) => {
  vi.resetModules();
  const { axiosInstance, publicAxiosInstance } = await import('../api/client');
  const offline = async () => {
    throw new Error('offline');
  };
  axiosInstance.defaults.adapter = offline;
  publicAxiosInstance.defaults.adapter = offline;
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});

  window.history.replaceState({}, '', path);
  const { default: App } = await import('../App');
  const container = document.body.appendChild(document.createElement('div'));
  const root = createRoot(container);
  await act(async () => root.render(<App />));
  await act(async () => new Promise((resolve) => setTimeout(resolve, 200)));
  const pathname = window.location.pathname;
  root.unmount();
  return pathname;
};

describe('employee page refresh', () => {
  it.each(['Employee', 'SuperAdmin', 2])('stays on the employee page (JWT role claim: %s)', async (claim) => {
    await loginAsEmployee(claim);
    expect(await reloadAt('/employee/business-card')).toBe('/employee/business-card');
  });

  it('stays on the employee page when session storage is lost and the token claims super-admin', async () => {
    await loginAsEmployee('SuperAdmin');
    sessionStorage.clear();
    expect(await reloadAt('/employee/business-card')).toBe('/employee/business-card');
  });

  it('does not keep the stored role after logout', async () => {
    await loginAsEmployee('Employee');
    const { authSessionStorage } = await import('../storage/auth-session.storage');
    authSessionStorage.clear();
    expect(sessionStorage.getItem('authMeta')).toBeNull();
    expect(localStorage.getItem('token')).toBeNull();
  });
});

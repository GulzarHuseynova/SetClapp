// @vitest-environment jsdom
import { AxiosError, AxiosHeaders, type AxiosResponse } from 'axios';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { runtimeStorage } from '../../storage/runtime.storage';
import { login } from './auth-login.helper';

const { authServiceMock } = vi.hoisted(() => ({
  authServiceMock: { login: vi.fn(), getAccountInfo: vi.fn(), changePassword: vi.fn() },
}));

vi.mock('../../services/auth.service', () => ({ authService: authServiceMock }));

const makeJwt = (claims: Record<string, unknown>) =>
  `e30.${btoa(JSON.stringify(claims)).replace(/=+$/, '')}.sig`;

const httpError = (status: number) => {
  const config = { headers: new AxiosHeaders() };
  const response = { status, data: {}, headers: {}, statusText: '', config } as AxiosResponse;
  return new AxiosError('Request failed', 'ERR_BAD_REQUEST', config, null, response);
};

const seedLocalCompanyAdmin = () => {
  runtimeStorage.setItem('companyAdminAccounts', JSON.stringify([
    { gmail: 'admin@x.az', voen: '123', password: 'secret', companyId: 'c1', companyName: 'X', adminName: 'A' },
  ]));
};

afterEach(() => {
  vi.resetAllMocks();
  localStorage.clear();
  runtimeStorage.clear();
});

describe('login', () => {
  it('rejects wrong credentials even when a matching local account exists', async () => {
    seedLocalCompanyAdmin();
    authServiceMock.login.mockRejectedValue(httpError(401));

    await expect(login({ email: 'admin@x.az', password: 'secret', companyVoen: '123' }))
      .rejects.toThrow('E-poçt, kod və ya VÖEN yanlışdır.');
    expect(localStorage.getItem('token')).toBeNull();
  });

  it('does not log in offline when the server is unreachable', async () => {
    seedLocalCompanyAdmin();
    authServiceMock.login.mockRejectedValue(new AxiosError('Network Error', 'ERR_NETWORK'));

    await expect(login({ email: 'admin@x.az', password: 'secret', companyVoen: '123' }))
      .rejects.toThrow('Serverə qoşulmaq mümkün olmadı');
  });

  it('does not grant super-admin when the backend returns no role', async () => {
    authServiceMock.login.mockResolvedValue({ data: { accessToken: makeJwt({ sub: 'u1' }) } });
    authServiceMock.getAccountInfo.mockResolvedValue({ data: {} });

    await expect(login({ email: 'someone@x.az', password: 'pw' }))
      .rejects.toThrow('Hesabın rolu müəyyən edilmədi');
  });

  it('keeps the backend role instead of promoting from local records', async () => {
    seedLocalCompanyAdmin();
    authServiceMock.login.mockResolvedValue({ data: { accessToken: makeJwt({ sub: 'e1', role: 'Employee' }) } });
    authServiceMock.getAccountInfo.mockResolvedValue({ data: { id: 'e1', role: 'Employee', email: 'admin@x.az' } });

    const result = await login({ email: 'admin@x.az', password: 'secret', companyVoen: '123' });
    expect(result.role).toBe('employee');
  });
});

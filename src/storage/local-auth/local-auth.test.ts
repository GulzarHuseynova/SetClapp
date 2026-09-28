// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { getStoredToken, readAuthStateFromStorage } from '../auth.storage';
import { runtimeStorage } from '../runtime.storage';
import { readLocalCompanyAdminAccounts } from './company-admin-local-auth';
import { readLocalEmployeeAccounts } from './employee-local-auth';

afterEach(() => {
  localStorage.clear();
  runtimeStorage.clear();
});

describe('forged local tokens', () => {
  it('treats a legacy local-company-admin token as no session', () => {
    localStorage.setItem('token', 'local-company-admin-abc');
    runtimeStorage.setItem('authMeta', JSON.stringify({ user: { role: 'company-admin', id: 'a@b.az' } }));

    expect(getStoredToken()).toBe('');
    expect(readAuthStateFromStorage().isAuthenticated).toBe(false);
  });
});

describe('stored passwords are scrubbed', () => {
  it('removes passwords from company admin records', () => {
    runtimeStorage.setItem('companyAdminAccounts', JSON.stringify([
      { gmail: 'admin@x.az', voen: '123', password: 'secret', companyId: 'c1', companyName: 'X', adminName: 'A' },
    ]));

    const [account] = readLocalCompanyAdminAccounts();
    expect(account.gmail).toBe('admin@x.az');
    expect('password' in account).toBe(false);
    expect(runtimeStorage.getItem('companyAdminAccounts')).not.toContain('secret');
  });

  it('removes passwords from employee records, including the localStorage backup', () => {
    const rows = JSON.stringify([{ id: 'e1', email: 'emp@x.az', voen: '123', password: 'secret' }]);
    localStorage.setItem('employeeAccounts', rows);

    const [employee] = readLocalEmployeeAccounts();
    expect(employee.email).toBe('emp@x.az');
    expect('password' in employee).toBe(false);
    expect(localStorage.getItem('employeeAccounts')).not.toContain('secret');
    expect(runtimeStorage.getItem('employeeAccounts')).not.toContain('secret');
  });
});

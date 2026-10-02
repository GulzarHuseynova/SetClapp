// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { postMock, putMock } = vi.hoisted(() => ({ postMock: vi.fn(), putMock: vi.fn() }));

vi.mock('../features/company/company-user-payloads', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../features/company/company-user-payloads')>()),
  postUserWithOptionalPhoto: postMock,
  putUserWithOptionalPhoto: putMock,
}));

import { companyActions } from './company.helper';
import type { AddUserPayload, UpdateUserPayload } from '../types/company.type';

const addPayload = {
  companyId: 'c1', companyVoen: '123', companyName: 'Pasha',
  firstName: 'Ali', lastName: 'Veli', jobTitle: 'Dev', email: 'ali@x.az', password: 'secret1',
  phone1: '+994501112233', isActive: true,
} as unknown as AddUserPayload;

beforeEach(() => {
  vi.resetAllMocks();
  localStorage.clear();
  sessionStorage.clear();
});

describe('photo upload failure reaches the caller', () => {
  it('addUser reports photoUploadFailed when the photo upload failed', async () => {
    postMock.mockResolvedValue({ id: 'u1', photoUploadFailed: true });
    const created = await companyActions.addUser(addPayload);
    expect(created.photoUploadFailed).toBe(true);
  });

  it('addUser does not report a failure when the upload succeeded', async () => {
    postMock.mockResolvedValue({ id: 'u1', photoUrl: 'https://cdn.x/p.png' });
    const created = await companyActions.addUser(addPayload);
    expect(created.photoUploadFailed).toBeUndefined();
  });

  it('updateUserProfile reports photoUploadFailed when the photo upload failed', async () => {
    putMock.mockResolvedValue({ id: 'u1', photoUploadFailed: true });
    const updated = await companyActions.updateUserProfile('u1', { firstName: 'Ali' } as unknown as UpdateUserPayload);
    expect(updated.photoUploadFailed).toBe(true);
  });

  it('updateUserProfile does not report a failure when the upload succeeded', async () => {
    putMock.mockResolvedValue({ id: 'u1', photoUrl: 'https://cdn.x/p.png' });
    const updated = await companyActions.updateUserProfile('u1', { firstName: 'Ali' } as unknown as UpdateUserPayload);
    expect(updated.photoUploadFailed).toBeUndefined();
  });
});

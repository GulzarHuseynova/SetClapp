import { describe, expect, it } from 'vitest';
import { cleanObject, findStringInObject, isGuidLike, toRecord } from './api.utils';
import { isEmailLike, stableQrUid } from './qr.utils';

describe('stableQrUid', () => {
  it('returns the same UUID-shaped id for the same seed', () => {
    const first = stableQrUid('employee@setclapp.com');
    expect(stableQrUid('employee@setclapp.com')).toBe(first);
    expect(first).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-a[0-9a-f]{3}-[0-9a-f]{12}$/);
    expect(stableQrUid('another@setclapp.com')).not.toBe(first);
  });

  it('still returns a valid id without a seed', () => {
    expect(stableQrUid('')).toMatch(/^[0-9a-f]{8}-/);
  });
});

describe('findStringInObject', () => {
  it('matches keys exactly after normalising case and separators, searching nested data', () => {
    const source = { data: { user: { First_Name: ' Ali ', companyId: 7 } } };
    expect(findStringInObject(source, ['firstName'])).toBe('Ali');
    expect(findStringInObject(source, ['companyid'])).toBe('7');
  });

  it('does not match on a key suffix', () => {
    expect(findStringInObject({ backupEmail: 'x@y.az' }, ['email'])).toBe('');
  });
});

describe('small helpers', () => {
  it('behave as before', () => {
    expect(isEmailLike('a@b.az')).toBe(true);
    expect(isGuidLike(' 3f2a1c9e-8b7d-4e6f-9a0b-1c2d3e4f5a6b ')).toBe(true);
    expect(isGuidLike('abc')).toBe(false);
    expect(toRecord(['x'])).toEqual({});
    expect(cleanObject({ a: 1, b: '', c: null, d: undefined, e: 0 })).toEqual({ a: 1, e: 0 });
  });
});

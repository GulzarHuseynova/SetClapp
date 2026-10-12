// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';
import { runtimeStorage } from '../storage/runtime.storage';
import { isUsableAssetValue, normalizeAssetUrl } from './asset-url.utils';
import { appendCacheBust, bumpAssetVersion, withAssetVersion } from './asset-version';

describe('asset-version', () => {
  beforeEach(() => runtimeStorage.clear());

  it('adds and replaces the cache-busting version', () => {
    expect(appendCacheBust('https://x.az/u/1.png', 5)).toBe('https://x.az/u/1.png?v=5');
    expect(appendCacheBust('https://x.az/u/1.png?v=5', 9)).toBe('https://x.az/u/1.png?v=9');
    expect(appendCacheBust('https://x.az/u/1.png?a=1', 9)).toBe('https://x.az/u/1.png?a=1&v=9');
    expect(appendCacheBust('data:image/png;base64,AAAA', 9)).toBe('data:image/png;base64,AAAA');
  });

  it('versions the url only after a new file was uploaded for that user', () => {
    expect(withAssetVersion('https://x.az/u/1.png', 'u1', 'photo')).toBe('https://x.az/u/1.png');
    bumpAssetVersion('u1', 'photo');
    expect(withAssetVersion('https://x.az/u/1.png', 'u1', 'photo')).toMatch(/\?v=\d+$/);
    expect(withAssetVersion('https://x.az/u/1.png', 'u2', 'photo')).toBe('https://x.az/u/1.png');
    expect(withAssetVersion('https://x.az/bg.png', 'u1', 'background')).toBe('https://x.az/bg.png');
  });
});

describe('social profile links are not images', () => {
  it('rejects profile pages but keeps real images', () => {
    expect(isUsableAssetValue('https://www.linkedin.com/in/yourname')).toBe(false);
    expect(isUsableAssetValue('https://instagram.com/someone')).toBe(false);
    expect(normalizeAssetUrl('https://www.linkedin.com/in/yourname')).toBe('');
    expect(isUsableAssetValue('https://media.licdn.com/photo.jpg')).toBe(true);
    expect(isUsableAssetValue('https://api.setclapp.com/uploads/a.png')).toBe(true);
  });
});

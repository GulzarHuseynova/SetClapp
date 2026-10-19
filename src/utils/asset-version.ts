import { runtimeStorage } from '../storage/runtime.storage';

const ASSET_VERSION_PREFIX = 'assetVersion:';

export type AssetKind = 'photo' | 'background';

const versionKey = (kind: AssetKind, id: string) => `${ASSET_VERSION_PREFIX}${kind}:${id}`;

export const bumpAssetVersion = (id: string | undefined, kind: AssetKind) => {
  const clean = String(id || '').trim();
  if (clean) runtimeStorage.setItem(versionKey(kind, clean), String(Date.now()));
};

export const appendCacheBust = (url: string, version: string | number = Date.now()) => {
  if (!url || /^(data|blob):/i.test(url)) return url;
  const withoutOld = url.replace(/([?&])v=\d+(&|$)/, (_match, prefix: string, suffix: string) => (suffix ? prefix : ''));
  const base = withoutOld.replace(/[?&]$/, '');
  return `${base}${base.includes('?') ? '&' : '?'}v=${version}`;
};

export const withAssetVersion = (url: string, id: string | undefined, kind: AssetKind) => {
  const clean = String(id || '').trim();
  if (!url || !clean) return url;
  const version = runtimeStorage.getItem(versionKey(kind, clean));
  return version ? appendCacheBust(url, version) : url;
};

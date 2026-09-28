import type { EditableProfileValues, ProfileSocialAccount } from '../../types/layout.type';
import { runtimeStorage } from '../../storage/runtime.storage';

let profileCache: Partial<EditableProfileValues> = {};
let avatarCache = '';
const COMPANY_ADMIN_AVATAR_KEY = 'companyAdminAvatar';
const COMPANY_ADMIN_PROFILE_KEY = 'companyAdminProfile:current';

const cloneSocialAccounts = (items?: ProfileSocialAccount[]) =>
  items?.map((item) => ({ ...item }));

const readPersistedProfile = (): Partial<EditableProfileValues> => {
  try {
    const raw = runtimeStorage.getItem(COMPANY_ADMIN_PROFILE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Partial<EditableProfileValues>;
    return {
      ...parsed,
      socialAccounts: cloneSocialAccounts(parsed.socialAccounts),
    };
  } catch {
    return {};
  }
};

const persistProfile = (profile: Partial<EditableProfileValues>) => {
  try {
    runtimeStorage.setItem(COMPANY_ADMIN_PROFILE_KEY, JSON.stringify(profile));
  } catch {
    // Runtime storage əlçatmaz olsa belə cari sessiya cache ilə davam edir.
  }
};

export const readRuntimeCompanyAdminProfile = (): Partial<EditableProfileValues> => {
  const persisted = readPersistedProfile();
  profileCache = {
    ...persisted,
    ...profileCache,
    socialAccounts: cloneSocialAccounts(profileCache.socialAccounts ?? persisted.socialAccounts),
  };

  return {
    ...profileCache,
    socialAccounts: cloneSocialAccounts(profileCache.socialAccounts),
  };
};

export const mergeRuntimeCompanyAdminProfile = (
  patch: Partial<EditableProfileValues>,
): Partial<EditableProfileValues> => {
  profileCache = {
    ...readPersistedProfile(),
    ...profileCache,
    ...patch,
    socialAccounts:
      patch.socialAccounts !== undefined
        ? cloneSocialAccounts(patch.socialAccounts)
        : cloneSocialAccounts(profileCache.socialAccounts ?? readPersistedProfile().socialAccounts),
  };

  persistProfile(profileCache);
  return readRuntimeCompanyAdminProfile();
};

export const readRuntimeCompanyAdminAvatar = () => avatarCache || runtimeStorage.getItem(COMPANY_ADMIN_AVATAR_KEY) || '';

export const setRuntimeCompanyAdminAvatar = (value?: string) => {
  avatarCache = String(value || '').trim();
  if (avatarCache) runtimeStorage.setItem(COMPANY_ADMIN_AVATAR_KEY, avatarCache);
  else runtimeStorage.removeItem(COMPANY_ADMIN_AVATAR_KEY);
  return avatarCache;
};

export const clearRuntimeCompanyAdminProfile = () => {
  profileCache = {};
  avatarCache = '';
  runtimeStorage.removeItem(COMPANY_ADMIN_AVATAR_KEY);
  runtimeStorage.removeItem(COMPANY_ADMIN_PROFILE_KEY);
};

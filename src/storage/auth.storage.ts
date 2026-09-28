import { isPersistentRuntimeKey, runtimeStorage } from './runtime.storage';
import {asBoolean,asString,extractCompanyId,extractCompanyVoen,extractUserId,findDeep,findStringDeep,isRecord,normalizeRole,parseJwt,} from '../utils/api.utils';
import type { AuthState } from '../types/auth-store.type';
import { ROLES } from '../constants/roles';
import type { StoredAuthMeta, StoredUserSession } from '../types/auth-store.type';

export const AUTH_TOKEN_KEY = 'token';
export const AUTH_USER_KEY = 'id';
const LEGACY_AUTH_USER_KEY = 'userId';
const AUTH_META_KEY = 'authMeta';

const LEGACY_AUTH_KEYS = [
  'accessToken',
  'refreshToken',
  'role',
  'companyId',
  'CompanyId',
  'companyID',
  'companyVoen',
  'companyVOEN',
  'voen',
  'user',
  'userId',
  'accountInfo',
  'companyAdminEmail',
  'companyAdminMustChangePassword',
  'companyAdminIsFirstLogin',
  'backendLoginCache',
];

const SESSION_LEGACY_AUTH_KEYS = [
  'accessToken',
  'refreshToken',
  'role',
  'companyId',
  'CompanyId',
  'companyID',
  'companyVoen',
  'companyVOEN',
  'voen',
  'user',
  'userId',
  'accountInfo',
  'companyAdminEmail',
  'companyAdminMustChangePassword',
  'companyAdminIsFirstLogin',
  'backendLoginCache',
];

const LEGACY_APP_PREFIXES = [
  'companyUsersCache:',
  'companyInfo:',
  'companyInfoVoen:',
  'companyLimit:',
  'companyLimitVoen:',
  'superAdminCompaniesCache',
];

const snapshotPersistentRuntimeEntries = () => {
  const entries: Array<[string, string]> = [];

  for (let index = 0; index < runtimeStorage.length; index += 1) {
    const key = runtimeStorage.key(index);
    // Sessiya meta-məlumatı (rol) logout-dan sonra bərpa olunmamalıdır.
    if (!key || key === AUTH_META_KEY || !isPersistentRuntimeKey(key)) continue;

    const value = runtimeStorage.getItem(key);
    if (value !== null) entries.push([key, value]);
  }

  return entries;
};

const restorePersistentRuntimeEntries = (entries: Array<[string, string]>) => {
  entries.forEach(([key, value]) => runtimeStorage.setItem(key, value));
};

const safeJsonParse = (value: string | null): unknown => {
  if (!value) return null;

  try {
    return JSON.parse(value) as unknown;
  } catch {
    return null;
  }
};

const hasStoredUserData = (user?: StoredUserSession | null) => {
  if (!user) return false;

  return Boolean(
    user.role ||
      user.companyId ||
      user.companyVoen ||
      user.id ||
      user.userId ||
      user.email ||
      user.accountInfo
  );
};

const readAuthMeta = (): StoredAuthMeta => {
  const parsed = safeJsonParse(runtimeStorage.getItem(AUTH_META_KEY));
  if (!isRecord(parsed)) return {};

  const user = isRecord(parsed.user) ? (parsed.user as StoredUserSession) : null;

  return {
    companyVoen: asString(parsed.companyVoen),
    user,
  };
};

const writeAuthMeta = (meta: StoredAuthMeta) => {
  const cleanUser = meta.user && hasStoredUserData(meta.user)
    ? meta.user
    : null;

  const cleanMeta: StoredAuthMeta = {
    companyVoen: asString(meta.companyVoen || cleanUser?.companyVoen),
    user: cleanUser,
  };

  if (cleanMeta.companyVoen || cleanMeta.user) {
    // Meta hər oxunuşda yenidən yazılır; dəyişməyibsə IndexedDB-yə boş yazı göndərilmir.
    const serialized = JSON.stringify(cleanMeta);
    if (runtimeStorage.getItem(AUTH_META_KEY) !== serialized) runtimeStorage.setItem(AUTH_META_KEY, serialized);
  } else {
    runtimeStorage.removeItem(AUTH_META_KEY);
  }
};

const patchAuthMetaFromSources = (...sources: unknown[]) => {
  const current = readAuthMeta();
  const nextCompanyVoen = extractCompanyVoen(...sources) || current.companyVoen || '';
  writeAuthMeta({ ...current, companyVoen: nextCompanyVoen });
};

const getFirstLoginFlag = (...sources: unknown[]) => {
  for (const source of sources) {
    const value = findDeep(source, ['isFirstLogin', 'firstLogin', 'mustChangePassword', 'forcePasswordChange']);
    if (value !== undefined && value !== null && value !== '') return asBoolean(value, false);
  }

  return false;
};

const getAccountInfo = (...sources: unknown[]): Record<string, unknown> | null => {
  for (const source of sources) {
    if (!isRecord(source)) continue;

    if (isRecord(source.accountInfo)) return source.accountInfo;
  }

  return null;
};

const getNameParts = (...sources: unknown[]) => {
  const firstName = findStringDeep(sources, ['firstName', 'first_name', 'givenName', 'ad']);
  const lastName = findStringDeep(sources, ['lastName', 'last_name', 'surname', 'soyad']);
  const fullName =
    findStringDeep(sources, ['fullName', 'userName', 'adminName', 'employeeName']) ||
    [firstName, lastName].filter(Boolean).join(' ');

  return { firstName, fullName, lastName };
};

const extractRoleFromSources = (...sources: unknown[]) => {
  for (const source of sources) {
    const role = findStringDeep(source, ['role', 'roles', 'userRole', 'roleName', 'accountRole']);
    if (role) return role;
  }

  return '';
};

// Rol JWT-dən oxunanda login ilə eyni qayda tətbiq olunur: backend employee tokenində də
// super-admin rolu qaytara bilir, amma şirkətə (VÖEN-ə) bağlı token super-admin ola bilməz.
const resolveTokenRole = (decoded: unknown) => {
  const role = normalizeRole(extractRoleFromSources(decoded));
  return role === ROLES.SUPER_ADMIN && extractCompanyVoen(decoded) ? ROLES.EMPLOYEE : role;
};

const toStoredUserForLocalStorage = (...sources: unknown[]): StoredUserSession => {
  const { firstName, fullName, lastName } = getNameParts(...sources);
  const id = extractUserId(...sources) || findStringDeep(sources, ['id']);
  const email = findStringDeep(sources, ['email', 'gmail', 'adminEmail', 'mail', 'emailAddress', 'userEmail']);
  const companyId = extractCompanyId(...sources);
  const companyVoen = extractCompanyVoen(...sources);
  const role = normalizeRole(extractRoleFromSources(...sources));
  const isFirstLogin = getFirstLoginFlag(...sources);
  const accountInfo = getAccountInfo(...sources);

  return {
    accountInfo,
    companyId,
    companyVoen,
    email,
    firstName,
    firstLogin: isFirstLogin,
    forcePasswordChange: isFirstLogin,
    fullName,
    id,
    isFirstLogin,
    lastName,
    mustChangePassword: isFirstLogin,
    role,
  };
};

const writeStoredUser = (user: StoredUserSession) => {
  const safeUser = toStoredUserForLocalStorage(user);
  const idValue = asString(safeUser.id || safeUser.userId || safeUser.email);

  if (idValue) localStorage.setItem(AUTH_USER_KEY, idValue);
  else localStorage.removeItem(AUTH_USER_KEY);

  localStorage.removeItem(LEGACY_AUTH_USER_KEY);
  localStorage.removeItem('user');

  const currentMeta = readAuthMeta();
  writeAuthMeta({
    ...currentMeta,
    companyVoen: safeUser.companyVoen || currentMeta.companyVoen,
    user: safeUser,
  });

  return safeUser;
};

export const cleanupLegacyAuthStorage = () => {
  LEGACY_AUTH_KEYS.forEach((key) => localStorage.removeItem(key));
  SESSION_LEGACY_AUTH_KEYS.forEach((key) => runtimeStorage.removeItem(key));

  const removeByPrefix = (storage: Storage) => {
    for (let index = storage.length - 1; index >= 0; index -= 1) {
      const key = storage.key(index);
      if (key && LEGACY_APP_PREFIXES.some((prefix) => key.startsWith(prefix))) {
        storage.removeItem(key);
      }
    }
  };

  removeByPrefix(localStorage);

  // Local Storage-də yalnız token və id qalır. Köhnə employee ilk-giriş
  // markerləri və şirkət loqoları varsa Session Storage-ə köçürülür.
  for (let index = localStorage.length - 1; index >= 0; index -= 1) {
    const key = localStorage.key(index);
    if (!key || key === AUTH_TOKEN_KEY || key === AUTH_USER_KEY) continue;

    const value = localStorage.getItem(key);
    if (value !== null && isPersistentRuntimeKey(key)) {
      runtimeStorage.setItem(key, value);
    }

    localStorage.removeItem(key);
  }
};

// Köhnə versiyaların brauzerdə yaratdığı saxta "local-*" tokenləri etibarsızdır.
const isForgedLocalToken = (token: string) => token.startsWith('local-');

export const getStoredToken = () => {
  const token = localStorage.getItem(AUTH_TOKEN_KEY) || localStorage.getItem('accessToken') || '';
  return isForgedLocalToken(token) ? '' : token;
};

export const getStoredUser = (): StoredUserSession | null => {
  const meta = readAuthMeta();

  if (isRecord(meta.user)) {
    const safeUser = writeStoredUser(meta.user as StoredUserSession);
    cleanupLegacyAuthStorage();

    return {
      ...safeUser,
      companyVoen: safeUser.companyVoen || meta.companyVoen,
      userId: safeUser.id,
      mustChangePassword: safeUser.isFirstLogin,
      firstLogin: safeUser.isFirstLogin,
      forcePasswordChange: safeUser.isFirstLogin,
    };
  }

  const token = getStoredToken();
  const decoded = token ? parseJwt(token) : {};
  const legacyUserIdRaw = localStorage.getItem(LEGACY_AUTH_USER_KEY);
  const legacyId = localStorage.getItem(AUTH_USER_KEY) || '';
  const legacyUserObject = safeJsonParse(localStorage.getItem('user'));
  const legacyUserIdObject = safeJsonParse(legacyUserIdRaw);
  const legacyAccountInfo = safeJsonParse(localStorage.getItem('accountInfo'));
  const legacyStoredUser = isRecord(legacyUserObject)
    ? (legacyUserObject as StoredUserSession)
    : isRecord(legacyUserIdObject)
      ? (legacyUserIdObject as StoredUserSession)
      : null;

  const legacyUser: StoredUserSession = {
    ...(legacyStoredUser || {}),
    role: asString(legacyStoredUser?.role) || localStorage.getItem('role') || resolveTokenRole(decoded),
    companyId: asString(legacyStoredUser?.companyId) || localStorage.getItem('companyId') || localStorage.getItem('CompanyId') || localStorage.getItem('companyID') || extractCompanyId(decoded),
    companyVoen: asString(legacyStoredUser?.companyVoen) || localStorage.getItem('companyVoen') || localStorage.getItem('companyVOEN') || localStorage.getItem('voen') || meta.companyVoen || extractCompanyVoen(decoded),
    id: asString(legacyStoredUser?.id || legacyStoredUser?.userId) || legacyId || (legacyUserIdRaw && !isRecord(legacyUserIdObject) ? legacyUserIdRaw : '') || extractUserId(decoded),
    email: asString(legacyStoredUser?.email) || localStorage.getItem('companyAdminEmail') || findStringDeep(decoded, ['email', 'gmail', 'userEmail']),
    accountInfo: isRecord(legacyAccountInfo) ? legacyAccountInfo : isRecord(legacyStoredUser?.accountInfo) ? legacyStoredUser.accountInfo : null,
    isFirstLogin: asBoolean(legacyStoredUser?.isFirstLogin, localStorage.getItem('companyAdminIsFirstLogin') === 'true'),
  };

  const hasLegacyUser = hasStoredUserData(legacyUser);

  if (!hasLegacyUser) return null;

  patchAuthMetaFromSources(legacyUser, legacyUser.accountInfo, decoded);
  const safeUser = writeStoredUser(legacyUser);
  cleanupLegacyAuthStorage();

  return {
    ...safeUser,
    companyVoen: legacyUser.companyVoen || meta.companyVoen,
    userId: safeUser.id,
    mustChangePassword: safeUser.isFirstLogin,
    firstLogin: safeUser.isFirstLogin,
    forcePasswordChange: safeUser.isFirstLogin,
  };
};

export const buildStoredUserFromState = (state: AuthState): StoredUserSession => {
  const decoded = state.accessToken && !isForgedLocalToken(state.accessToken) ? parseJwt(state.accessToken) : {};
  const accountInfo = state.accountInfo;
  const fallback = {
    companyId: state.companyId,
    companyVoen: state.companyVoen,
    id: state.userId,
    role: state.role,
  };

  patchAuthMetaFromSources(fallback, accountInfo, decoded);
  return toStoredUserForLocalStorage({ ...fallback, accountInfo }, accountInfo, decoded);
};

export const persistAuthSession = (state: AuthState) => {
  if (state.accessToken) {
    localStorage.setItem(AUTH_TOKEN_KEY, state.accessToken);
  } else {
    localStorage.removeItem(AUTH_TOKEN_KEY);
  }

  if (state.isAuthenticated || state.accessToken || state.role || state.accountInfo || state.userId) {
    writeStoredUser(buildStoredUserFromState(state));
  } else {
    localStorage.removeItem(AUTH_USER_KEY);
    runtimeStorage.removeItem(AUTH_META_KEY);
  }

  cleanupLegacyAuthStorage();

  if (state.isAuthenticated) runtimeStorage.setItem('isAuthenticated', 'true');
  else runtimeStorage.removeItem('isAuthenticated');
};

export const patchStoredUser = (patch: Partial<StoredUserSession>) => {
  const current = getStoredUser() || {};
  patchAuthMetaFromSources(current, patch, patch.accountInfo);

  const safeUser = writeStoredUser({ ...current, ...patch });
  cleanupLegacyAuthStorage();

  return {
    ...safeUser,
    companyVoen: readAuthMeta().companyVoen,
    userId: safeUser.id,
    mustChangePassword: safeUser.isFirstLogin,
    firstLogin: safeUser.isFirstLogin,
    forcePasswordChange: safeUser.isFirstLogin,
  };
};

export const replaceStoredAuthSession = (token: string, user: StoredUserSession) => {
  if (token) localStorage.setItem(AUTH_TOKEN_KEY, token);
  else localStorage.removeItem(AUTH_TOKEN_KEY);

  patchAuthMetaFromSources(user, user.accountInfo);
  writeStoredUser(user);
  cleanupLegacyAuthStorage();
};

export const clearStoredAuthSession = () => {
  const persistentRuntimeEntries = snapshotPersistentRuntimeEntries();

  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(AUTH_USER_KEY);
  localStorage.removeItem(LEGACY_AUTH_USER_KEY);
  runtimeStorage.clear();
  runtimeStorage.removeItem(AUTH_META_KEY);
  restorePersistentRuntimeEntries(persistentRuntimeEntries);
  cleanupLegacyAuthStorage();
};

export const readAuthStateFromStorage = (): AuthState => {
  const token = getStoredToken();
  const user = getStoredUser();
  const decoded = token ? parseJwt(token) : {};

  const role = normalizeRole(user?.role || resolveTokenRole(decoded));
  const companyId = asString(user?.companyId) || extractCompanyId(decoded);
  const companyVoen = asString(user?.companyVoen) || extractCompanyVoen(decoded);
  const userId = asString(user?.id || user?.userId) || localStorage.getItem(AUTH_USER_KEY) || extractUserId(decoded);

  return {
    isAuthenticated: Boolean(token && role),
    accessToken: token,
    refreshToken: '',
    role,
    companyId,
    companyVoen,
    userId,
    accountInfo: user?.accountInfo || null,
  };
};


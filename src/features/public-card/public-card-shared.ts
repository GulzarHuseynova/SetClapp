import { runtimeStorage } from '../../storage/runtime.storage';
import { asString, findStringDeep, normalizeArray, type AnyRecord } from '../../utils/api.utils';
import { getSavedCompanyLogo, getSavedCompanySnapshot, mapCompanyLogoResponse } from '../../storage/company.storage';
import { normalizeAssetUrl } from '../../utils/asset-url.utils';
import type { PublicCardProfile, ScanSource } from '../../types/public-card.type';
import { stableQrUid, isEmailLike } from '../../utils/qr.utils';

export const PUBLIC_CARD_STORAGE_KEY = 'publicCardProfiles';
export const PUBLIC_SCAN_LOGS_KEY = 'publicScanLogs';

export const normalizeText = (value: unknown) => asString(value).trim();
export const normalizeEmail = (value: unknown) => normalizeText(value).toLowerCase();
export const pickPublicEmail = (record: AnyRecord) => normalizeText(
  record.email ||
    record.email1 ||
    record.gmail ||
    record.mail ||
    record.emailAddress ||
    record.userEmail ||
    record.workEmail ||
    findStringDeep(record, ['email', 'email1', 'gmail', 'mail', 'emailAddress', 'userEmail', 'workEmail'])
).toLowerCase();

const isInlinePhoto = (value: string) => /^(data:image\/|blob:)/i.test(value);
const rawBase64ImagePattern = /^[A-Za-z0-9+/\r\n]+={0,2}$/;

const rawImageMime = (value: string) => {
  if (value.startsWith('iVBOR')) return 'image/png';
  if (value.startsWith('R0lGOD')) return 'image/gif';
  if (value.startsWith('UklGR')) return 'image/webp';
  if (value.startsWith('PHN2Zy') || value.startsWith('PD94bWw')) return 'image/svg+xml';
  return 'image/jpeg';
};

export const normalizeEmployeePhotoValue = (value: unknown, depth = 0): string => {
  if (depth > 2 || value === undefined || value === null) return '';

  if (typeof value === 'object') {
    const record = value as Record<string, unknown>;
    const nestedKeys = ['url', 'src', 'href', 'path', 'value', 'data', 'base64', 'content', 'fileUrl', 'filePath'];

    for (const key of nestedKeys) {
      const normalized = normalizeEmployeePhotoValue(record[key], depth + 1);
      if (normalized) return normalized;
    }

    return '';
  }

  const text = String(value).trim();
  if (!text) return '';
  if (isInlinePhoto(text)) return text;

  // Public endpoint bəzi istifadəçilər üçün photoData-nı data URL prefiksi
  // olmadan xam base64 kimi qaytara bilir.
  const compact = text.replace(/\s+/g, '');
  if (compact.length > 160 && rawBase64ImagePattern.test(compact)) {
    return `data:${rawImageMime(compact)};base64,${compact}`;
  }

  return normalizeAssetUrl(text);
};

/**
 * Public kart üçün şəkil seçərkən lokal seçilmiş data/blob şəkli üstün tutulur.
 * Backend bəzən truthy, amma açılmayan köhnə photoUrl qaytardığı üçün sadə `a || b`
 * yanaşması düzgün lokal şəkli kölgədə qoyurdu.
 */
export const pickPublicCardPhoto = (...values: unknown[]) => {
  const normalized = values
    .map((value) => normalizeEmployeePhotoValue(value))
    .filter(Boolean);

  return normalized.find(isInlinePhoto) || normalized[0] || '';
};

export const getEmployeePhotoFromRecord = (record: AnyRecord) => {
  const keys = [
    'photoUrl',
    'PhotoUrl',
    'photoURL',
    'photoData',
    'PhotoData',
    'photoBase64',
    'profilePhotoData',
    'profilePhotoBase64',
    'profilePhotoUrl',
    'profilePhotoURL',
    'profileImageUrl',
    'profileImageData',
    'employeePhotoUrl',
    'employeePhotoData',
    'employeeImageUrl',
    'employeeImageData',
    'userPhotoUrl',
    'userPhotoData',
    'userImageUrl',
    'userImageData',
    'avatarUrl',
    'avatarData',
    'imageUrl',
    'imageURL',
    'imageData',
    'pictureUrl',
    'pictureData',
    'photo',
    'profilePhoto',
    'employeePhoto',
    'userPhoto',
    'avatar',
    'image',
    'picture',
    'photoPath',
    'imagePath',
    'fileUrl',
    'filePath',
  ];

  const directValues = keys.map((key) => record[key]);
  const deepValue = findStringDeep(record, keys);

  return pickPublicCardPhoto(...directValues, deepValue);
};

export const getCompanyLogoFromSources = (...sources: unknown[]) => {
  for (const source of sources) {
    const logo = mapCompanyLogoResponse(source);
    if (logo) return logo;
  }

  return '';
};

export const getSavedCompanyLogoForProfile = (companyId?: string, companyVoen?: string) => {
  const snapshot = getSavedCompanySnapshot(companyId, companyVoen);
  return getCompanyLogoFromSources(snapshot) || getSavedCompanyLogo(companyId, companyVoen);
};

export const resolveQrUid = (...values: unknown[]) => {
  for (const value of values) {
    const text = normalizeText(value);
    if (text && !isEmailLike(text)) return text;
  }

  return stableQrUid(values.map((value) => normalizeText(value)).find(Boolean) || crypto.randomUUID());
};

const readArrayFromStorage = <T>(storage: Storage, key: string): T[] => {
  try {
    const raw = storage.getItem(key);
    if (!raw) return [];
    return normalizeArray<T>(JSON.parse(raw));
  } catch {
    return [];
  }
};

export const readStoredArray = <T>(key: string): T[] => {
  const rows: T[] = [];
  const seen = new Set<string>();

  const append = (items: T[]) => {
    items.forEach((row) => {
      const fingerprint = JSON.stringify(row);
      if (seen.has(fingerprint)) return;
      seen.add(fingerprint);
      rows.push(row);
    });
  };

  append(readArrayFromStorage<T>(runtimeStorage, key));

  const legacyRows = readArrayFromStorage<T>(localStorage, key);
  append(legacyRows);

  if (rows.length > 0) {
    runtimeStorage.setItem(key, JSON.stringify(rows));
  }

  localStorage.removeItem(key);
  return rows;
};

export const saveStoredArray = <T>(key: string, rows: T[]) => {
  runtimeStorage.setItem(key, JSON.stringify(rows));
  localStorage.removeItem(key);
};

const getPublicCardOrigin = () => {
  if (typeof window === 'undefined') return '';
  return window.location.origin;
};

export const getPublicCardUrl = (employeeId: string, source: ScanSource = 'QR') => {
  const cleanId = encodeURIComponent(employeeId || 'card');
  const origin = getPublicCardOrigin();

  // Direct keçiddə browser URL-ni lazımsız ?source=Direct parametrindən təmiz saxlayırıq.
  // PublicCard özü Direct-i default qəbul edir və məlumat üçün GET /api/cards/{id}
  // sorğusunu source=Direct ilə backend-ə göndərir.
  if (source === 'Direct') return `${origin}/card/${cleanId}`;
  return `${origin}/card/${cleanId}?source=${source}`;
};

export const getDeviceOS = (userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : '') => {
  const ua = userAgent.toLowerCase();
  if (/iphone|ipad|ipod/.test(ua)) return 'iOS';
  if (/android/.test(ua)) return 'Android';
  if (/windows/.test(ua)) return 'Windows';
  if (/macintosh|mac os/.test(ua)) return 'macOS';
  if (/linux/.test(ua)) return 'Linux';
  return 'Unknown';
};

export const getFullName = (profile: Pick<PublicCardProfile, 'firstName' | 'lastName' | 'middleName' | 'email'>) => {
  return [profile.firstName, profile.lastName, profile.middleName].filter(Boolean).join(' ').trim() || profile.email || 'Əməkdaş';
};

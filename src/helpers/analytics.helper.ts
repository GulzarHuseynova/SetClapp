import { analyticsService } from '../services/analytics.service';
import type { AnalyticsQueryParams, ScanLogParams } from '../types/company-admin.type';
import { asNumber, findDeep, normalizeArray, unwrapData } from '../utils/api.utils';
import { getLocalAnalytics } from '../storage/local-auth/employee-local-auth';
import { getSavedCompanyId, getSavedCompanyVoen } from '../storage/company.storage';
import { getPublicScanAnalytics } from '../features/public-card/public-card';

const readCount = (data: unknown) => {
  const unwrapped = unwrapData(data);

  if (typeof unwrapped === 'number') return unwrapped;

  if (typeof unwrapped === 'string') {
    const parsed = Number(unwrapped);
    if (Number.isFinite(parsed)) return parsed;
  }

  return asNumber(
    findDeep(unwrapped, ['count', 'total', 'totalScans', 'totalScanCount', 'scanCount', 'scansCount', 'value', 'data', 'result']),
    0,
  );
};

const getMergedLocalAnalytics = () => {
  const companyId = getSavedCompanyId();
  const companyVoen = getSavedCompanyVoen();
  const local = getLocalAnalytics();
  const publicAnalytics = getPublicScanAnalytics(companyId, companyVoen);

  return {
    totalScans: Math.max(local.totalScans, publicAnalytics.totalScans),
    chart: publicAnalytics.chart.length > 0 ? publicAnalytics.chart : local.chart,
    ranking: publicAnalytics.ranking.length > 0 ? publicAnalytics.ranking : local.ranking,
    scanLogs: publicAnalytics.scanLogs.length > 0 ? publicAnalytics.scanLogs : local.scanLogs,
  };
};

const getAnalyticsParams = <T extends AnalyticsQueryParams>(params?: T): AnalyticsQueryParams & T => {
  const companyId = params?.companyId || getSavedCompanyId();
  return {
    ...((params || {}) as T),
    ...(companyId ? { companyId } : {}),
  };
};

const readRowValue = (row: unknown, keys: string[]) => {
  if (!row || typeof row !== 'object') return '';
  const record = row as Record<string, unknown>;
  for (const key of keys) {
    const value = record[key];
    if (value !== undefined && value !== null && String(value).trim()) return String(value).trim();
  }
  return '';
};

const toTimestamp = (value: string) => {
  if (!value) return Number.NaN;
  const direct = new Date(value).getTime();
  if (Number.isFinite(direct)) return direct;

  // API/local mock may return DD.MM.YYYY or DD.MM.YYYY HH:mm strings.
  const match = value.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})(?:[ T](\d{1,2}):?(\d{2})?)?/);
  if (!match) return Number.NaN;
  const [, day, month, year, hour = '0', minute = '0'] = match;
  return new Date(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute)).getTime();
};

const getRowDate = (row: unknown) =>
  readRowValue(row, ['date', 'createdAt', 'updatedAt', 'timestamp', 'scannedAt', 'scanDate', 'createdDate', 'time']);

const getRowEmployeeId = (row: unknown) =>
  readRowValue(row, ['employeeId', 'userId', 'cardId', 'id']);

const getRowEmployeeName = (row: unknown) =>
  readRowValue(row, ['employeeName', 'userName', 'fullName', 'employee', 'user', 'email', 'userEmail', 'employeeEmail']) || 'Əməkdaş';

const getRowEmployeeEmail = (row: unknown) =>
  readRowValue(row, ['email', 'userEmail', 'employeeEmail', 'user']);

const filterLocalLogs = (rows: unknown[], params?: AnalyticsQueryParams) => {
  const start = params?.startDate ? new Date(params.startDate).getTime() : Number.NEGATIVE_INFINITY;
  const end = params?.endDate ? new Date(params.endDate).getTime() : Number.POSITIVE_INFINITY;
  const employeeId = String(params?.employeeId || '').trim().toLowerCase();

  return rows.filter((row) => {
    const time = toTimestamp(getRowDate(row));
    if (params?.startDate && Number.isFinite(time) && time < start) return false;
    if (params?.endDate && Number.isFinite(time) && time > end) return false;

    if (employeeId) {
      const rowEmployeeId = getRowEmployeeId(row).toLowerCase();
      const rowEmail = getRowEmployeeEmail(row).toLowerCase();
      if (rowEmployeeId !== employeeId && rowEmail !== employeeId) return false;
    }

    return true;
  });
};

const paginateLocalRows = (rows: unknown[], params?: ScanLogParams) => {
  const page = Math.max(1, Number(params?.page || 1));
  const pageSize = Math.max(1, Number(params?.pageSize || 20));
  const startIndex = (page - 1) * pageSize;
  return rows.slice(startIndex, startIndex + pageSize);
};

const buildLocalChart = (rows: unknown[]) => {
  const grouped = new Map<string, number>();

  rows.forEach((row) => {
    const dateValue = getRowDate(row);
    const timestamp = toTimestamp(dateValue);
    const key = Number.isFinite(timestamp)
      ? new Date(timestamp).toISOString().slice(0, 10)
      : dateValue || 'unknown';
    grouped.set(key, (grouped.get(key) || 0) + 1);
  });

  return Array.from(grouped.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, count]) => ({ date, count, scanCount: count }));
};

const buildLocalRanking = (rows: unknown[]) => {
  const grouped = new Map<string, { id: string; name: string; email: string; count: number }>();

  rows.forEach((row) => {
    const id = getRowEmployeeId(row);
    const email = getRowEmployeeEmail(row);
    const name = getRowEmployeeName(row);
    const key = id || email || name;
    const current = grouped.get(key) || { id, name, email, count: 0 };
    current.count += 1;
    grouped.set(key, current);
  });

  return Array.from(grouped.values())
    .sort((a, b) => b.count - a.count)
    .map((row) => ({
      key: row.id || row.email || row.name,
      id: row.id,
      employeeId: row.id,
      employee: row.name,
      employeeName: row.name,
      userName: row.name,
      user: row.email,
      email: row.email,
      scans: row.count,
      scanCount: row.count,
    }));
};

// Lokal fallback (storage oxunması və parse) yalnız API istifadə oluna bilməyəndə hesablanır;
// əks halda hər filtr klikində sorğudan əvvəl əsas thread boş yerə yüklənirdi.
const requestOrFallback = async <T>(
  request: () => Promise<{ data: unknown }>,
  getFallback: () => T,
  mapper: (data: unknown) => T,
  companyId?: string,
) => {
  if (!companyId) return getFallback();

  try {
    const response = await request();
    // Empty arrays and zero are valid filtered API results. Do not silently
    // replace them with unfiltered local data; that made the period filters look broken.
    return mapper(response.data);
  } catch {
    return getFallback();
  }
};

const hasAnalyticsFilter = (params?: AnalyticsQueryParams) =>
  Boolean(params?.startDate || params?.endDate || params?.employeeId);

export const analyticsActions = {
  getScansCount: async (params?: AnalyticsQueryParams) => {
    const requestParams = getAnalyticsParams(params);
    const getFallback = () => {
      const local = getMergedLocalAnalytics();
      return hasAnalyticsFilter(params) ? filterLocalLogs(local.scanLogs, params).length : local.totalScans;
    };

    return requestOrFallback(
      () => analyticsService.getScansCount(requestParams),
      getFallback,
      readCount,
      requestParams.companyId,
    );
  },

  getScansChart: async (params?: AnalyticsQueryParams) => {
    const requestParams = getAnalyticsParams(params);
    const getFallback = () => {
      const local = getMergedLocalAnalytics();
      return hasAnalyticsFilter(params) ? buildLocalChart(filterLocalLogs(local.scanLogs, params)) : local.chart;
    };

    return requestOrFallback(
      () => analyticsService.getScansChart(requestParams),
      getFallback,
      (data) => normalizeArray(data),
      requestParams.companyId,
    );
  },

  getEmployeesRanking: async (params?: AnalyticsQueryParams) => {
    const requestParams = getAnalyticsParams(params);
    const getFallback = () => {
      const local = getMergedLocalAnalytics();
      return hasAnalyticsFilter(params) ? buildLocalRanking(filterLocalLogs(local.scanLogs, params)) : local.ranking;
    };

    return requestOrFallback(
      () => analyticsService.getEmployeesRanking(requestParams),
      getFallback,
      (data) => normalizeArray(data),
      requestParams.companyId,
    );
  },

  getScansLogs: async (params?: ScanLogParams) => {
    const requestParams = getAnalyticsParams(params);
    const getFallback = () => paginateLocalRows(filterLocalLogs(getMergedLocalAnalytics().scanLogs, params), params);

    return requestOrFallback(
      () => analyticsService.getScansLogs(requestParams),
      getFallback,
      (data) => normalizeArray(data),
      requestParams.companyId,
    );
  },
};

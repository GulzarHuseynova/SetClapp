import { useEffect, useMemo, useState } from 'react';
import { useCompanyAdmin } from '../../../hooks/use-company-admin';
import type { AnalyticsRankingRow, AnalyticsScanLogRow, UserData } from '../../../types/company-admin.type';

type PeriodKey = 'day' | 'week' | 'month' | 'year';
type ChartItem = { key: string; label: string; value: number; sort: number };

const PERIODS: Array<{ key: PeriodKey; label: string }> = [
  { key: 'day', label: 'Gün' },
  { key: 'week', label: 'Həftə' },
  { key: 'month', label: 'Ay' },
  { key: 'year', label: 'İl' },
];

const MONTH_SHORT = ['Yan', 'Fev', 'Mar', 'Apr', 'May', 'İyn', 'İyl', 'Avq', 'Sen', 'Okt', 'Noy', 'Dek'];
const WEEKDAY_SHORT = ['B.', 'B.e', 'Ç.a', 'Ç.', 'C.a', 'C.', 'Ş.'];

const toNumber = (value: unknown) => {
  const parsed = typeof value === 'number' ? value : Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
};

const toRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};

const readText = (row: Record<string, unknown>, keys: string[]) => {
  for (const key of keys) {
    const value = row[key];
    if (value !== undefined && value !== null && String(value).trim()) return String(value).trim();
  }
  return '';
};

const rankingName = (row: AnalyticsRankingRow) =>
  row.employeeName || row.employee || row.userName || row.fullName || row.user ||
  `${row.firstName || ''} ${row.lastName || ''}`.trim() || row.email || 'Əməkdaş';

const rankingValue = (row: AnalyticsRankingRow) =>
  toNumber(row.scanCount ?? row.scans ?? row.count ?? row.total ?? 0);

const getPeriodRange = (period: PeriodKey) => {
  const end = new Date();
  const start = new Date(end);

  if (period === 'day') {
    start.setHours(0, 0, 0, 0);
  } else if (period === 'week') {
    const currentDay = start.getDay() || 7;
    start.setDate(start.getDate() - currentDay + 1);
    start.setHours(0, 0, 0, 0);
  } else if (period === 'month') {
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
  } else {
    start.setMonth(0, 1);
    start.setHours(0, 0, 0, 0);
  }

  return { startDate: start.toISOString(), endDate: end.toISOString() };
};

const parseDate = (value: string) => {
  if (!value) return null;
  const direct = new Date(value);
  if (!Number.isNaN(direct.getTime())) return direct;

  const match = value.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})(?:[ T](\d{1,2}):?(\d{2})?)?/);
  if (!match) return null;
  const [, day, month, year, hour = '0', minute = '0'] = match;
  const parsed = new Date(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute));
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const periodLabel = (date: Date, period: PeriodKey) => {
  if (period === 'day') return `${String(date.getHours()).padStart(2, '0')}:00`;
  if (period === 'week') return WEEKDAY_SHORT[date.getDay()];
  if (period === 'month') return String(date.getDate());
  return MONTH_SHORT[date.getMonth()];
};

const periodKey = (date: Date, period: PeriodKey) => {
  if (period === 'day') return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}-${date.getHours()}`;
  if (period === 'week' || period === 'month') return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
  return `${date.getFullYear()}-${date.getMonth()}`;
};

const chartTitle = (period: PeriodKey) => ({
  day: 'Saatlıq skan',
  week: 'Həftəlik skan',
  month: 'Aylıq skan',
  year: 'İllik skan',
}[period]);

const rangeCaption = (period: PeriodKey) => {
  const now = new Date();
  if (period === 'day') return now.toLocaleDateString('az-AZ', { day: '2-digit', month: '2-digit', year: 'numeric' });
  if (period === 'week') return 'Bu həftə';
  if (period === 'month') return now.toLocaleDateString('az-AZ', { month: 'long', year: 'numeric' });
  return String(now.getFullYear());
};

const logIdentity = (log: AnalyticsScanLogRow) =>
  String(log.employeeId || log.cardId || log.email || log.userEmail || log.user || log.employeeName || log.userName || '');

const logDate = (log: AnalyticsScanLogRow) => {
  const row = log as Record<string, unknown>;
  return readText(row, ['date', 'createdAt', 'updatedAt', 'timestamp', 'scannedAt', 'scanDate', 'createdDate', 'time']);
};

const userName = (user: UserData) =>
  `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email || 'Əməkdaş';

const buildChartFromLogs = (logs: AnalyticsScanLogRow[], period: PeriodKey) => {
  const grouped = new Map<string, ChartItem>();

  logs.forEach((log) => {
    const date = parseDate(logDate(log));
    if (!date) return;
    const key = periodKey(date, period);
    const existing = grouped.get(key);
    grouped.set(key, {
      key,
      label: periodLabel(date, period),
      value: (existing?.value || 0) + 1,
      sort: date.getTime(),
    });
  });

  return Array.from(grouped.values()).sort((a, b) => a.sort - b.sort);
};

const normalizeChartRows = (rows: unknown[], period: PeriodKey) => {
  const grouped = new Map<string, ChartItem>();

  rows.forEach((item, index) => {
    const row = toRecord(item);
    const rawDate = readText(row, ['date', 'period', 'timestamp', 'createdAt', 'scanDate']);
    const rawLabel = readText(row, ['label', 'name', 'key', 'month', 'day', 'hour']);
    const value = toNumber(row.count ?? row.scanCount ?? row.scans ?? row.total ?? row.value);
    const date = parseDate(rawDate);

    if (date) {
      const key = periodKey(date, period);
      const previous = grouped.get(key);
      grouped.set(key, {
        key,
        label: periodLabel(date, period),
        value: (previous?.value || 0) + value,
        sort: date.getTime(),
      });
      return;
    }

    if (period === 'year' && /^\d{1,2}$/.test(rawLabel)) {
      const monthIndex = Number(rawLabel) - 1;
      if (monthIndex >= 0 && monthIndex < 12) {
        grouped.set(`month-${monthIndex}`, {
          key: `month-${monthIndex}`,
          label: MONTH_SHORT[monthIndex],
          value,
          sort: monthIndex,
        });
        return;
      }
    }

    grouped.set(`raw-${rawLabel || index}`, {
      key: `raw-${rawLabel || index}`,
      label: rawLabel || String(index + 1),
      value,
      sort: index,
    });
  });

  return Array.from(grouped.values()).sort((a, b) => a.sort - b.sort);
};

export default function CompanyAnalytics() {
  const {
    analyticsCount,
    analyticsChart,
    analyticsRanking,
    scanLogs,
    usersList,
    currentEmployeesCount,
    fetchAnalytics,
  } = useCompanyAdmin();

  const [period, setPeriod] = useState<PeriodKey>('year');
  const [showAllRanking, setShowAllRanking] = useState(false);
  useEffect(() => {
    void fetchAnalytics(getPeriodRange(period));
  }, [fetchAnalytics, period]);

  const chartRows = useMemo<ChartItem[]>(() => {
    const apiRows = normalizeChartRows(analyticsChart, period);
    const source = apiRows.length > 0 ? apiRows : buildChartFromLogs(scanLogs, period);

    if (period === 'day') return source.slice(-12);
    if (period === 'week') return source.slice(-7);
    if (period === 'month') return source.slice(-12);
    return source.slice(-12);
  }, [analyticsChart, period, scanLogs]);

  const maxChartValue = Math.max(...chartRows.map((item) => item.value), 1);
  const activeBarIndex = chartRows.length > 0
    ? chartRows.reduce((best, item, index, source) => item.value >= source[best].value ? index : best, 0)
    : -1;

  const rankingRows = useMemo(() => {
    const source = [...analyticsRanking].sort((a, b) => rankingValue(b) - rankingValue(a));
    return source.map((row) => {
      const id = String(row.employeeId || row.id || row.email || row.user || '');
      const name = rankingName(row);
      const user = usersList.find((candidate) =>
        String(candidate.id || '') === id ||
        String(candidate.email || '').toLowerCase() === String(row.email || row.user || '').toLowerCase() ||
        userName(candidate).toLowerCase() === name.toLowerCase());
      return { ...row, resolvedName: name, jobTitle: user?.jobTitle || '' };
    });
  }, [analyticsRanking, usersList]);

  const visibleRanking = showAllRanking ? rankingRows : rankingRows.slice(0, 3);
  const rankingMax = Math.max(...rankingRows.map(rankingValue), 1);
  const averageScans = currentEmployeesCount > 0 ? Math.round(analyticsCount / currentEmployeesCount) : 0;
  const uniqueContacts = new Set(scanLogs.map(logIdentity).filter(Boolean)).size;

  return (
    <div className="ca-reference-page ca-analytics-page">
      <div className="ca-period-filter" role="tablist" aria-label="Analitika dövrü">
        {PERIODS.map((item) => (
          <button
            key={item.key}
            type="button"
            className={period === item.key ? 'is-active' : ''}
            onClick={() => setPeriod(item.key)}
            aria-selected={period === item.key}
          >
            {item.label}
          </button>
        ))}
      </div>


      <section className="ca-stat-grid">
        <article className="ca-stat-tile">
          <span>Ümumi skan</span>
          <strong>{analyticsCount}</strong>
          <small>seçilmiş dövr üzrə</small>
        </article>
        <article className="ca-stat-tile">
          <span>Aktiv vizitkart</span>
          <strong>{currentEmployeesCount}</strong>
          <small>{usersList.length} əməkdaşdan</small>
        </article>
        <article className="ca-stat-tile">
          <span>Ortalama skan</span>
          <strong>{averageScans}</strong>
          <small>1 əməkdaşa düşən</small>
        </article>
        <article className="ca-stat-tile">
          <span>Yeni kontakt</span>
          <strong>{uniqueContacts}</strong>
          <small>bu dövrdə skan edənlər</small>
        </article>
      </section>

      <section className="ca-reference-card ca-chart-card">
        <div className="ca-card-heading-row">
          <h3>{chartTitle(period)}</h3>
          <span>{rangeCaption(period)}</span>
        </div>

        {chartRows.length === 0 ? (
          <div className="ca-empty-state">Bu dövr üçün skan məlumatı yoxdur.</div>
        ) : (
          <div
            className="ca-mini-chart"
            style={{ gridTemplateColumns: `repeat(${Math.max(chartRows.length, 1)}, minmax(30px, 1fr))` }}
          >
            {chartRows.map((item, index) => (
              <div className="ca-chart-column" key={item.key} title={`${item.label}: ${item.value}`}>
                <div className="ca-chart-track">
                  <span
                    className={index === activeBarIndex ? 'is-active' : ''}
                    style={{ height: `${Math.max(12, Math.round((item.value / maxChartValue) * 92))}%` }}
                  />
                </div>
                <small className={index === activeBarIndex ? 'is-active' : ''}>{item.label}</small>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="ca-reference-card ca-ranking-card">
        <div className="ca-ranking-header">
          <h3>Əməkdaş reytinqi</h3>
          {rankingRows.length > 3 && (
            <button type="button" onClick={() => setShowAllRanking((value) => !value)}>
              {showAllRanking ? 'İlk 3' : 'Hamısı'}
            </button>
          )}
        </div>

        {visibleRanking.length === 0 ? (
          <div className="ca-empty-state">Bu dövr üçün reytinq məlumatı yoxdur.</div>
        ) : visibleRanking.map((row, index) => {
          const value = rankingValue(row);
          const initials = row.resolvedName.split(/\s+/).filter(Boolean).map((part) => part[0]).join('').slice(0, 2).toUpperCase();
          return (
            <article className="ca-ranking-row" key={String(row.key || row.id || row.email || `${row.resolvedName}-${index}`)}>
              <span className="ca-rank-index">{index + 1}</span>
              <span className="ca-rank-avatar">{initials || 'Ə'}</span>
              <div className="ca-rank-copy">
                <strong>{row.resolvedName}</strong>
                <small>{row.jobTitle || 'Əməkdaş'}</small>
                <span className="ca-rank-progress"><i style={{ width: `${Math.max(5, (value / rankingMax) * 100)}%` }} /></span>
              </div>
              <b>{value}</b>
            </article>
          );
        })}
      </section>
    </div>
  );
}

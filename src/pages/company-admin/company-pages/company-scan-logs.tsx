import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { DatePicker, Select, Spin } from 'antd';
import { ScanOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { analyticsActions } from '../../../helpers/analytics.helper';
import { useCompanyAdmin } from '../../../hooks/use-company-admin';
import type { AnalyticsScanLogRow } from '../../../types/company-admin.type';

const PAGE_SIZE = 20;

const readLogField = (record: AnalyticsScanLogRow, keys: string[]) => {
  const raw = record as Record<string, unknown>;
  for (const key of keys) {
    const value = raw[key];
    if (value !== undefined && value !== null && String(value).trim()) return String(value).trim();
  }
  return '';
};

const logDate = (record: AnalyticsScanLogRow) =>
  readLogField(record, ['date', 'createdAt', 'updatedAt', 'timestamp', 'scannedAt', 'scanDate', 'createdDate', 'time']);

const logName = (record: AnalyticsScanLogRow) =>
  readLogField(record, ['userName', 'employeeName', 'fullName', 'employee', 'user', 'email', 'userEmail', 'employeeEmail']) || 'Əməkdaş';

const rowKey = (record: AnalyticsScanLogRow, index: number) =>
  String(record.key || record.id || `${record.employeeId || record.cardId || logName(record)}-${logDate(record)}-${index}`);

const formatDateTime = (value?: string) => {
  const parsed = dayjs(value);
  if (!value || !parsed.isValid()) return value || '-';
  return parsed.format('DD.MM · HH:mm');
};

export default function CompanyScanLogs() {
  const { usersList } = useCompanyAdmin();
  const [employeeId, setEmployeeId] = useState<string>();
  const [startDate, setStartDate] = useState(() => dayjs().startOf('month').toISOString());
  const [endDate, setEndDate] = useState(() => dayjs().endOf('day').toISOString());
  const [rows, setRows] = useState<AnalyticsScanLogRow[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const pageRef = useRef(1);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const loadingRef = useRef(false);
  const requestVersionRef = useRef(0);

  const employeeOptions = useMemo(() => usersList
    .filter((user) => user.isActive !== false)
    .map((user) => ({
      value: String(user.id || user.email || ''),
      label: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email || 'Əməkdaş',
    }))
    .filter((item) => Boolean(item.value)), [usersList]);

  const filterParams = useMemo(() => ({
    ...(employeeId ? { employeeId } : {}),
    startDate,
    endDate,
  }), [employeeId, endDate, startDate]);

  const loadPage = useCallback(async (page: number, replace = false) => {
    if (loadingRef.current) return;

    const version = requestVersionRef.current;
    loadingRef.current = true;
    setLoading(true);

    try {
      const result = await analyticsActions.getScansLogs({
        ...filterParams,
        page,
        pageSize: PAGE_SIZE,
      });

      if (version !== requestVersionRef.current) return;
      const nextRows = Array.isArray(result) ? result as AnalyticsScanLogRow[] : [];

      let nextLength = nextRows.length;
      setRows((previous) => {
        const source = replace ? [] : previous;
        const unique = new Map<string, AnalyticsScanLogRow>();
        source.forEach((row, index) => unique.set(rowKey(row, index), row));
        nextRows.forEach((row, index) => unique.set(rowKey(row, source.length + index), row));
        const merged = Array.from(unique.values());
        nextLength = merged.length;
        return merged;
      });

      pageRef.current = page;
      setHasMore(totalCount > 0 ? nextLength < totalCount : nextRows.length === PAGE_SIZE);
    } finally {
      if (version === requestVersionRef.current) {
        loadingRef.current = false;
        setLoading(false);
      }
    }
  }, [filterParams, totalCount]);

  useEffect(() => {
    requestVersionRef.current += 1;
    loadingRef.current = false;
    pageRef.current = 1;

    const version = requestVersionRef.current;

    const resetAndLoad = async () => {
      await Promise.resolve();
      if (version !== requestVersionRef.current) return;
      setRows([]);
      setTotalCount(0);
      setHasMore(true);
      setLoading(true);

      const count = await analyticsActions.getScansCount(filterParams);
      if (version !== requestVersionRef.current) return;
      const normalizedCount = Number(count) || 0;
      setTotalCount(normalizedCount);

      const firstPage = await analyticsActions.getScansLogs({
        ...filterParams,
        page: 1,
        pageSize: PAGE_SIZE,
      });
      if (version !== requestVersionRef.current) return;

      const nextRows = Array.isArray(firstPage) ? firstPage as AnalyticsScanLogRow[] : [];
      setRows(nextRows);
      pageRef.current = 1;
      setHasMore(normalizedCount > 0 ? nextRows.length < normalizedCount : nextRows.length === PAGE_SIZE);
    };

    loadingRef.current = true;
    void resetAndLoad().finally(() => {
      if (version === requestVersionRef.current) {
        loadingRef.current = false;
        setLoading(false);
      }
    });
  }, [filterParams]);

  const loadNext = useCallback(() => {
    if (!hasMore || loadingRef.current) return;
    void loadPage(pageRef.current + 1);
  }, [hasMore, loadPage]);

  useEffect(() => {
    const target = sentinelRef.current;
    if (!target || !hasMore) return;

    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) loadNext();
    }, { rootMargin: '220px 0px' });

    observer.observe(target);
    return () => observer.disconnect();
  }, [hasMore, loadNext]);

  const displayedCount = totalCount || rows.length;

  return (
    <div className="ca-reference-page ca-scan-logs-page">
      <section className="ca-reference-card ca-scan-filter-card">
        <label>Əməkdaş</label>
        <Select
          allowClear
          value={employeeId}
          placeholder="Bütün əməkdaşlar"
          options={employeeOptions}
          onChange={(value) => setEmployeeId(value ? String(value) : undefined)}
          className="ca-full-control"
        />

        <label>Tarix aralığı</label>
        <DatePicker.RangePicker
          className="ca-full-control"
          format="DD.MM.YYYY"
          allowClear={false}
          value={[dayjs(startDate), dayjs(endDate)]}
          onChange={(dates) => {
            if (!dates?.[0] || !dates?.[1]) return;
            setStartDate(dates[0].startOf('day').toISOString());
            setEndDate(dates[1].endOf('day').toISOString());
          }}
        />
      </section>

      <section className="ca-reference-card ca-scan-summary-card">
        <span className="ca-scan-summary-icon"><ScanOutlined /></span>
        <div>
          <small>Bu aralıqda</small>
          <strong>{displayedCount} skan</strong>
        </div>
      </section>

      <section className="ca-reference-card ca-scan-list-card">
        {rows.length === 0 && !loading ? (
          <div className="ca-empty-state">Seçilmiş aralıqda skan tapılmadı.</div>
        ) : rows.map((row, index) => {
          const name = logName(row);
          const initials = name.split(/\s+/).filter(Boolean).map((part) => part[0]).join('').slice(0, 2).toUpperCase();
          return (
            <article className="ca-scan-row" key={rowKey(row, index)}>
              <span className="ca-scan-avatar">{initials || 'Ə'}</span>
              <strong>{name}</strong>
              <time>{formatDateTime(logDate(row))}</time>
            </article>
          );
        })}
      </section>

      <div ref={sentinelRef} className="ca-infinite-sentinel" aria-live="polite">
        {loading && <Spin size="small" />}
        {!loading && !hasMore && rows.length > 0 && <span className="ca-list-end">Bütün skanlar göstərildi</span>}
      </div>
    </div>
  );
}

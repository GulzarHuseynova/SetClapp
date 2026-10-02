import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router';
import { Avatar, Dropdown, Segmented, Space, Switch, Tooltip } from 'antd';
import { message } from '../../../../utils/antd-static';
import { ArrowLeftOutlined, ContactsOutlined, DownloadOutlined, EyeOutlined, GlobalOutlined, LinkOutlined, MoreOutlined, QrcodeOutlined, TeamOutlined, UserOutlined } from '@ant-design/icons';
import type { UserData } from '../../../../types/company-admin.type';
import { stripSocialLinksFromAdditionalInfo } from '../../../../features/profile/profile-info';
import { getEmployeePhotoFromRecord } from '../../../../features/public-card/public-card-shared';
import { AppButton } from '../../../../components/ui/app-button';
import { CommonBusinessCardView } from '../../../../components/common-business-card-view';
import type { BusinessCardViewModel } from '../../../../types/business-card-view.type';
import { cleanText } from '../../../../components/business-card-links';
import { CardQrModal } from '../../../../components/card-qr-modal';
import {downloadQrByFormat,downloadVCard,getQrPayload,normalizeUserToPublicProfile,} from '../../../../features/public-card/public-card';
import { userActions } from '../../../../helpers/user.helper';
import type { BusinessCardToolbarProps, EmployeesTableProps } from '../../../../types/business-card.type';

export function BusinessCardToolbar({
  activeUsersCount,
  archivedUsersCount,
  currentEmployeesCount,
  employeeLimit,
  isLimitReached,
  onOpenAdd,
}: BusinessCardToolbarProps) {

  return (
    <Space className="business-card-toolbar mb-4! flex! w-full! justify-between!" wrap>
      <div>
        <h2 className="m-0">Vizit kartlar</h2>
        <p className="m-0 text-slate-500">
          Aktiv: {activeUsersCount} / Deaktiv: {archivedUsersCount} / Limit: {currentEmployeesCount}/{employeeLimit}
        </p>
      </div>

      <Space className="business-card-toolbar-actions" wrap>
        <Tooltip title={isLimitReached ? `Limit aşılıb. Maksimum ${employeeLimit} işçi ola bilər.` : ''}>
          <AppButton className="ca-primary-action force-navy-action" type="primary" icon={<TeamOutlined />} disabled={isLimitReached} onClick={onOpenAdd}>
            Yeni işçi əlavə et
          </AppButton>
        </Tooltip>
      </Space>
    </Space>
  );
}

const employeeName = (user: UserData) => {
  const fullName = [cleanText(user.firstName), cleanText(user.lastName)].filter(Boolean).join(' ');
  return fullName || cleanText(user.email) || 'İşçi';
};

const employeeInitials = (user: UserData) => {
  const first = cleanText(user.firstName).charAt(0);
  const last = cleanText(user.lastName).charAt(0);
  return `${first}${last}`.toUpperCase() || 'İ';
};

const normalizeIdentity = (value: unknown) => String(value || '').trim().toLowerCase();

export function EmployeesTable({
  employeeStatusTab,
  activeUsersCount,
  archivedUsersCount,
  tableRows,
  hasMore,
  onLoadMore,
  company,
  companyCardBackground,
  protectedAdminKeys,
  vcfLoadingId,
  onStatusTabChange,
  onOpenEditUser,
  onToggleUserStatus,
  onToggleUserCanEdit,
  onDownloadVcf,
  onViewPublicCard,
  onCopyPublicCardLink,
  onOpenResetPassword,
}: EmployeesTableProps) {
  const { employeeId = '' } = useParams<{ employeeId?: string }>();
  const [employeeDetailState, setEmployeeDetailState] = useState<{
    key: string;
    user: UserData | null;
    error: string;
  }>({ key: '', user: null, error: '' });
  const [qrEmployee, setQrEmployee] = useState<UserData | null>(null);
  const [qrBusy, setQrBusy] = useState<'png' | 'svg' | 'offline-vcf' | 'online-vcf' | null>(null);
  const infiniteScrollSentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const cleanId = decodeURIComponent(employeeId || '').trim();
    if (!cleanId) return;

    let cancelled = false;

    void userActions.getUserById(cleanId)
      .then((user) => {
        if (!cancelled) {
          setEmployeeDetailState({ key: cleanId, user: user as unknown as UserData, error: '' });
        }
      })
      .catch((error) => {
        if (cancelled) return;
        console.error('GET /api/User/{id} employee detail xətası:', error);
        setEmployeeDetailState({ key: cleanId, user: null, error: 'İşçi məlumatı serverdən yüklənmədi.' });
        message.error('İşçi məlumatı serverdən yüklənmədi.');
      });

    return () => {
      cancelled = true;
    };
  }, [employeeId]);

  useEffect(() => {
    const node = infiniteScrollSentinelRef.current;
    if (!node || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) onLoadMore();
      },
      { root: null, rootMargin: '260px 0px', threshold: 0.01 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [hasMore, onLoadMore, tableRows.length]);

  const selectedRouteId = decodeURIComponent(employeeId || '').trim();
  const selectedEmployee = employeeDetailState.key === selectedRouteId ? employeeDetailState.user : null;
  const employeeLoadError = employeeDetailState.key === selectedRouteId ? employeeDetailState.error : '';
  const isEmployeeDetailLoading = Boolean(selectedRouteId) && employeeDetailState.key !== selectedRouteId;
  const selectedStatus = selectedEmployee?.isActive !== false;
  const selectedCanEdit = selectedEmployee?.canEdit !== false;
  const isProtectedAdmin = (user?: UserData | null) => {
    if (!user) return false;
    const keys = [user.id, user.email].map(normalizeIdentity).filter(Boolean);
    return keys.some((key) => protectedAdminKeys.includes(key));
  };

  const selectedCompanyName = useMemo(
    () => cleanText(selectedEmployee?.companyName) || cleanText(company.name) || 'Şirkət',
    [company.name, selectedEmployee?.companyName],
  );

  const selectedCardBackground = cleanText(selectedEmployee?.cardBackgroundUrl) || cleanText(companyCardBackground);
  const selectedAdditionalInfo = stripSocialLinksFromAdditionalInfo(
    selectedEmployee?.additionalInfo,
    [selectedEmployee?.linkedin, selectedEmployee?.facebook, selectedEmployee?.instagram],
  );

  const handleStatusChange = async () => {
    if (!selectedEmployee) return;
    if (selectedStatus && isProtectedAdmin(selectedEmployee)) return;
    await onToggleUserStatus(selectedEmployee.id, selectedStatus);
    setEmployeeDetailState((previous) => previous.user
      ? { ...previous, user: { ...previous.user, isActive: !selectedStatus } }
      : previous);
  };

  const handleListStatusChange = async (record: UserData, checked: boolean) => {
    const currentStatus = record.isActive !== false;
    if (checked === currentStatus) return;
    if (!checked && isProtectedAdmin(record)) return;
    await onToggleUserStatus(record.id, currentStatus);
  };

  const handleCanEditChange = async (checked: boolean) => {
    if (!selectedEmployee) return;
    await onToggleUserCanEdit(selectedEmployee.id, !checked);
    setEmployeeDetailState((previous) => previous.user
      ? { ...previous, user: { ...previous.user, canEdit: checked } }
      : previous);
  };

  const qrProfile = useMemo(
    () => qrEmployee ? normalizeUserToPublicProfile(qrEmployee, company) : null,
    [company, qrEmployee],
  );

  const runQrAction = async (type: 'png' | 'svg' | 'offline-vcf' | 'online-vcf') => {
    if (!qrEmployee || !qrProfile) return;
    try {
      setQrBusy(type);
      if (type === 'png' || type === 'svg') {
        await downloadQrByFormat(qrProfile, type);
        message.success(`QR ${type.toUpperCase()} faylı yükləndi.`);
        return;
      }
      if (type === 'offline-vcf') {
        await downloadVCard(qrProfile);
        message.success('İnternetsiz kontakt faylı hazırlandı.');
        return;
      }
      await onDownloadVcf(qrEmployee);
    } catch {
      message.error('Əməliyyat tamamlanmadı.');
    } finally {
      setQrBusy(null);
    }
  };

  const selectedEmployeeCard: BusinessCardViewModel | null = selectedEmployee
    ? {
        profile: normalizeUserToPublicProfile(
          {
            ...selectedEmployee,
            companyName: selectedCompanyName,
            cardBackgroundUrl: selectedCardBackground,
            additionalInfo: selectedAdditionalInfo,
          },
          company,
        ),
        actions: {
          onEdit: () => onOpenEditUser(selectedEmployee),
          onAddContact: () => onDownloadVcf(selectedEmployee),
          addContactLoading: vcfLoadingId === selectedEmployee.id,
          onChangeCode: () => onOpenResetPassword(selectedEmployee),
          onQrCode: () => setQrEmployee(selectedEmployee),
        },
        settings: {
          showEditPermission: true,
          canEdit: selectedCanEdit,
          onCanEditChange: handleCanEditChange,
          showStatus: !isProtectedAdmin(selectedEmployee),
          isActive: selectedStatus,
          onStatusChange: handleStatusChange,
        },
      }
    : null;

  return (
    <>
      {!employeeId && (
        <>
        <div className="employee-card-tabs">
          <Segmented
            value={employeeStatusTab}
            onChange={onStatusTabChange}
            options={[
              { label: `Aktiv (${activeUsersCount})`, value: 'active' },
              { label: `Deaktiv (${archivedUsersCount})`, value: 'inactive' },
            ]}
          />
        </div>

        {tableRows.length === 0 ? (
          <div className="employee-card-empty">
            {employeeStatusTab === 'active' ? 'Aktiv işçi tapılmadı' : 'Deaktiv işçi tapılmadı'}
          </div>
        ) : (
          <div className="employee-card-grid">
            {tableRows.map((record) => (
              <div key={record.__tableRowKey} className="employee-list-card">
                <Link
                  to={`/company-admin/employees/${encodeURIComponent(record.id)}`}
                  className="employee-list-card-route-link"
                  aria-label={`${employeeName(record)} vizitkartını aç`}
                />
                <div className="employee-list-card-top">
                  <Avatar
                    size={54}
                    src={getEmployeePhotoFromRecord(record as unknown as Record<string, unknown>) || undefined}
                    icon={<UserOutlined />}
                    className="employee-list-avatar"
                  >
                    {employeeInitials(record)}
                  </Avatar>

                  <div className="employee-list-card-main">
                    <div className="employee-list-name-row">
                      <strong>{employeeName(record)}</strong>
                      <span className="employee-list-card-actions">
                        {!isProtectedAdmin(record) && (
                          <Tooltip title={record.isActive !== false ? 'Deaktiv et' : 'Aktiv et'}>
                            <Switch
                              size="small"
                              checked={record.isActive !== false}
                              onClick={(_checked, event) => event.stopPropagation()}
                              onChange={(checked, event) => {
                                event.stopPropagation();
                                void handleListStatusChange(record, checked);
                              }}
                            />
                          </Tooltip>
                        )}

                        <Dropdown
                          trigger={['click']}
                          placement="bottomRight"
                          rootClassName="employee-card-menu"
                          menu={{
                            items: [
                              { key: 'view', icon: <EyeOutlined />, label: 'Public card-a bax' },
                              { key: 'copy', icon: <LinkOutlined />, label: 'Linki kopyala' },
                            ],
                            onClick: ({ key, domEvent }) => {
                              domEvent.stopPropagation();
                              if (key === 'view') onViewPublicCard(record);
                              else void onCopyPublicCardLink(record);
                            },
                          }}
                        >
                          <AppButton
                            type="text"
                            shape="circle"
                            className="employee-public-view-button"
                            icon={<MoreOutlined style={{ fontSize: 18 }} />}
                            aria-label={`${employeeName(record)} public card əməliyyatları`}
                            onClick={(event) => event.stopPropagation()}
                          />
                        </Dropdown>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {hasMore && (
          <div ref={infiniteScrollSentinelRef} className="employee-infinite-scroll-sentinel" aria-hidden="true" />
        )}
        </>
      )}

      {employeeId && (
        <section className="employee-detail-route-page">
          <div className="employee-detail-route-header">
            <Link to="/company-admin/employees" className="employee-detail-back-link">
              <ArrowLeftOutlined />
              <span>Əməkdaşlara qayıt</span>
            </Link>
          </div>

          {isEmployeeDetailLoading && !employeeLoadError && (
            <div className="employee-card-detail-loading">İşçi məlumatı yüklənir...</div>
          )}

          {employeeLoadError && (
            <div className="employee-card-detail-error">
              <span>{employeeLoadError}</span>
              <Link to="/company-admin/employees">Əməkdaşlara qayıt</Link>
            </div>
          )}

          {!isEmployeeDetailLoading && !employeeLoadError && selectedEmployeeCard && (
            <CommonBusinessCardView card={selectedEmployeeCard} />
          )}
        </section>
      )}

      <CardQrModal
        open={Boolean(qrEmployee && qrProfile)}
        onClose={() => setQrEmployee(null)}
        icon={<QrcodeOutlined />}
        title={qrEmployee ? `${employeeName(qrEmployee)} QR kodu` : ''}
        subtitle="Kontakta əlavə et və QR faylını yüklə"
        qrValue={qrProfile ? getQrPayload(qrProfile) : ''}
      >
        <div className="employee-qr-download-grid">
          <AppButton icon={<DownloadOutlined />} loading={qrBusy === 'png'} onClick={() => void runQrAction('png')}>PNG yüklə</AppButton>
          <AppButton icon={<DownloadOutlined />} loading={qrBusy === 'svg'} onClick={() => void runQrAction('svg')}>SVG yüklə</AppButton>
        </div>

        <div className="employee-qr-contact-grid">
          <AppButton className="force-navy-action" icon={<ContactsOutlined />} loading={qrBusy === 'offline-vcf'} onClick={() => void runQrAction('offline-vcf')}>
            İnternetsiz kontakta əlavə et
          </AppButton>
          <AppButton className="force-navy-action" icon={<GlobalOutlined />} loading={qrBusy === 'online-vcf'} onClick={() => void runQrAction('online-vcf')}>
            İnternetlə kontakta əlavə et
          </AppButton>
        </div>
      </CardQrModal>
    </>
  );
}

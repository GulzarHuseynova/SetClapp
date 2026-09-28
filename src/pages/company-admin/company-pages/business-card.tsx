import { useMemo, useState } from 'react';
import { Button, Form, Input, Modal, message } from 'antd';
import { exportImportActions } from '../../../helpers/export-import.helper';
import {downloadVCard,getPublicCardUrl,normalizeUserToPublicProfile,savePublicCardProfilesFromUsers,} from '../../../features/public-card/public-card';
import { useCompanyAdmin } from '../../../hooks/use-company-admin';
import { KeyOutlined } from '@ant-design/icons';
import type { AddUserFormValues, UserData } from '../../../types/company-admin.type';
import { BusinessCardToolbar, EmployeesTable } from './business-card/business-card-sections';
import { AddEmployeeModal, EditEmployeeModal } from './business-card/business-card-modals';
import type { BusinessCardTableRow, EmployeeStatusTab } from '../../../types/business-card.type';
import {applyEmployeeLinkSnapshot,employeeDedupKey,employeeRowKey,fileToDataUrl,isSuperAdminRow,saveEmployeeLinkSnapshot,userIdentity,} from '../../../features/company-admin/business-card';
import { stripSocialLinksFromAdditionalInfo } from '../../../features/profile/profile-info';
import { normalizePhoneForBackend, normalizePhoneForInput } from '../../../utils/phone.utils';
import { getSavedCompanyCardBackground } from '../../../features/company/company-card-theme';
import { readRuntimeCompanyAdminProfile } from '../../../features/company-admin/runtime-profile';
import { getEmployeePhotoFromRecord } from '../../../features/public-card/public-card-shared';
import { normalizeInlineImageData } from '../../../utils/asset-url.utils';
import { useAuthSelector } from '../../../store/authStore';
import { getStoredUser } from '../../../storage/auth.storage';

interface BusinessCardProps {
  detailOnly?: boolean;
}

export function EmployeeDetailsPage() {
  return <BusinessCard detailOnly />;
}

export default function BusinessCard({ detailOnly = false }: BusinessCardProps) {
  const {
    company,
    usersList,
    activeCompanyId,
    currentEmployeesCount,
    isLimitReached,
    addUser,
    updateUser,
    toggleUserStatus,
    toggleUserCanEdit,
    resetUserPassword,
  } = useCompanyAdmin();
  const authUserId = useAuthSelector((state) => state.userId);
  const accountInfo = useAuthSelector((state) => state.accountInfo);

  const [form] = Form.useForm<AddUserFormValues>();
  const [editForm] = Form.useForm<Partial<AddUserFormValues>>();
  const [resetPasswordForm] = Form.useForm<{ newPassword: string }>();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [vcfLoadingId, setVcfLoadingId] = useState<string | null>(null);
  const [employeeStatusTab, setEmployeeStatusTab] = useState<EmployeeStatusTab>('active');
  const EMPLOYEE_BATCH_SIZE = 10;
  const [visibleEmployeeCount, setVisibleEmployeeCount] = useState(EMPLOYEE_BATCH_SIZE);
  const [photoPreview, setPhotoPreview] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedEditUserId, setSelectedEditUserId] = useState('');
  const [editSubmitLoading, setEditSubmitLoading] = useState(false);
  const [editPhotoPreview, setEditPhotoPreview] = useState('');
  const [editPhotoFile, setEditPhotoFile] = useState<File | null>(null);
  const [resetPasswordUser, setResetPasswordUser] = useState<UserData | null>(null);
  const [resetPasswordLoading, setResetPasswordLoading] = useState(false);

  const companyCardBackground = getSavedCompanyCardBackground(
    activeCompanyId || company.id,
    company.voen,
  ) || readRuntimeCompanyAdminProfile().cardBackgroundUrl || '';

  const protectedAdminKeys = useMemo(() => {
    const stored = getStoredUser();
    const accountRecord = accountInfo && typeof accountInfo === 'object'
      ? accountInfo as Record<string, unknown>
      : {};

    return [
      authUserId,
      stored?.userId,
      stored?.id,
      stored?.email,
      accountRecord.userId,
      accountRecord.id,
      accountRecord.email,
      accountRecord.gmail,
    ]
      .map((value) => String(value || '').trim().toLowerCase())
      .filter(Boolean);
  }, [accountInfo, authUserId]);

  const companyUsers = useMemo(
    () => usersList.filter((user) => !isSuperAdminRow(user)).map(applyEmployeeLinkSnapshot),
    [usersList],
  );

  const activeUsers = useMemo(
    () => companyUsers.filter((user) => user.isActive !== false),
    [companyUsers],
  );

  const archivedUsers = useMemo(
    () => companyUsers.filter((user) => user.isActive === false),
    [companyUsers],
  );

  const visibleUsersRaw = employeeStatusTab === 'active' ? activeUsers : archivedUsers;
  const visibleUsers = useMemo(() => {
    const seen = new Set<string>();

    return visibleUsersRaw.filter((user) => {
      const key = employeeDedupKey(user);
      if (!key) return true;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [visibleUsersRaw]);

  const selectedEditUser = useMemo(() => {
    return companyUsers.find((user) => userIdentity(user) === selectedEditUserId);
  }, [companyUsers, selectedEditUserId]);

  const loadedUsers = visibleUsers.slice(0, visibleEmployeeCount);
  const hasMoreEmployees = loadedUsers.length < visibleUsers.length;

  const tableRows: BusinessCardTableRow[] = loadedUsers.map((user, index) => ({
    ...user,
    __tableRowKey: [
      employeeRowKey(user) || 'employee',
      index,
      user.email || 'no-email',
      user.phone1 || 'no-phone',
    ].join('-'),
  }));

  const loadMoreEmployees = () => {
    setVisibleEmployeeCount((current) => Math.min(current + EMPLOYEE_BATCH_SIZE, visibleUsers.length));
  };

  const handlePhotoSelect = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      message.error('Zəhmət olmasa şəkil faylı seçin.');
      return false;
    }

    try {
      const photoUrl = await fileToDataUrl(file);
      setPhotoFile(file);
      setPhotoPreview(photoUrl);
      form.setFieldsValue({ photo: photoUrl, photoUrl });
      message.success('Foto seçildi və məlumat yenilənəndə saxlanacaq.');
    } catch {
      message.error('Şəkli oxumaq mümkün olmadı.');
    }

    return false;
  };

  const openAddModal = () => {
    form.resetFields();
    setPhotoFile(null);
    setPhotoPreview('');
    setIsModalOpen(true);
  };

  const closeAddModal = () => {
    setIsModalOpen(false);
    form.resetFields();
    setPhotoFile(null);
    setPhotoPreview('');
  };


  const normalizeBirthDateForBackend = (value?: string) => {
    const text = String(value || '').trim();
    if (!text) return '';

    const displayMatch = text.match(/^(\d{2})-(\d{2})-(\d{4})$/);
    if (displayMatch) return `${displayMatch[3]}-${displayMatch[2]}-${displayMatch[1]}`;

    const isoMatch = text.match(/^(\d{4})-(\d{2})-(\d{2})/);
    return isoMatch ? `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}` : text;
  };

  const handleAddUser = async (values: AddUserFormValues) => {
    try {
      setSubmitLoading(true);
      await addUser({
        ...values,
        phone1: normalizePhoneForBackend(values.phone1),
        phone2: normalizePhoneForBackend(values.phone2),
        whatsapp: normalizePhoneForBackend(values.whatsapp),
        photo: photoPreview || values.photo || '',
        photoUrl: photoPreview || values.photoUrl || '',
        photoData: normalizeInlineImageData(photoPreview || values.photoData || values.photoUrl || values.photo),
        photoFile: photoFile || undefined,
        dateOfBirth: normalizeBirthDateForBackend(values.dateOfBirth),
      });
      closeAddModal();
    } finally {
      setSubmitLoading(false);
    }
  };

  const preserveExistingValue = <T,>(nextValue: T | undefined, currentValue: T | undefined) => {
    if (nextValue === undefined || nextValue === null) return currentValue;
    if (typeof nextValue === 'string' && nextValue.trim() === '') return currentValue;
    return nextValue;
  };

  const socialValueFromAdditionalInfo = (value: unknown, key: 'linkedin' | 'facebook' | 'instagram') => {
    const text = String(value || '');
    const row = text.split(/[;\n]+/).find((part) => part.toLowerCase().includes(key));
    if (!row) return '';
    const [, ...rest] = row.split(':');
    return rest.join(':').trim();
  };

  const socialValueFromUser = (user: UserData, key: 'linkedin' | 'facebook' | 'instagram') => {
    const record = user as unknown as Record<string, unknown>;
    if (key === 'linkedin') return String(record.linkedin || record.linkedinUrl || record.linkedInUrl || socialValueFromAdditionalInfo(record.additionalInfo, key) || '');
    if (key === 'facebook') return String(record.facebook || record.facebookUrl || socialValueFromAdditionalInfo(record.additionalInfo, key) || '');
    return String(record.instagram || record.instagramUrl || socialValueFromAdditionalInfo(record.additionalInfo, key) || '');
  };

  const normalizeBirthDateForInput = (value?: string) => {
    const text = String(value || '').trim();
    if (!text) return '';

    const isoMatch = text.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (isoMatch) return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`;

    const dottedMatch = text.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/);
    if (dottedMatch) {
      const day = dottedMatch[1].padStart(2, '0');
      const month = dottedMatch[2].padStart(2, '0');
      const year = dottedMatch[3];
      return `${year}-${month}-${day}`;
    }

    return text;
  };

  const openEditUser = (user: UserData) => {
    setSelectedEditUserId(userIdentity(user));
    setEditPhotoFile(null);
    setEditPhotoPreview(getEmployeePhotoFromRecord(user as unknown as Record<string, unknown>));
    editForm.setFieldsValue({
      firstName: user.firstName,
      lastName: user.lastName,
      middleName: user.middleName,
      jobTitle: user.jobTitle,
      email: user.email,
      phone1: normalizePhoneForInput(user.phone1),
      phone2: normalizePhoneForInput(user.phone2),
      extensionNumber: user.extensionNumber,
      whatsapp: normalizePhoneForInput(user.whatsapp),
      linkedin: socialValueFromUser(user, 'linkedin'),
      facebook: socialValueFromUser(user, 'facebook'),
      instagram: socialValueFromUser(user, 'instagram'),
      photo: getEmployeePhotoFromRecord(user as unknown as Record<string, unknown>),
      photoUrl: user.photoUrl || user.photo,
      photoData: user.photoData || normalizeInlineImageData(user.photo || user.photoUrl),
      additionalInfo: stripSocialLinksFromAdditionalInfo(user.additionalInfo, [
        socialValueFromUser(user, 'linkedin'),
        socialValueFromUser(user, 'facebook'),
        socialValueFromUser(user, 'instagram'),
      ]),
      dateOfBirth: normalizeBirthDateForInput(user.dateOfBirth),
      address: user.address,
      googleMapsUrl: user.googleMapsUrl,
      cardBackgroundUrl: user.cardBackgroundUrl,
      socialAccounts: user.socialAccounts || [],
    });
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setSelectedEditUserId('');
    setEditPhotoFile(null);
    setEditPhotoPreview('');
    editForm.resetFields();
  };

  const handleEditPhotoSelect = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      message.error('Zəhmət olmasa şəkil faylı seçin.');
      return false;
    }

    try {
      const photoUrl = await fileToDataUrl(file);
      setEditPhotoFile(file);
      setEditPhotoPreview(photoUrl);
      editForm.setFieldsValue({ photo: photoUrl, photoUrl });
      message.success('Foto seçildi və məlumat yenilənəndə saxlanacaq.');
    } catch {
      message.error('Şəkli oxumaq mümkün olmadı.');
    }

    return false;
  };

  const handleEditUser = async (values: Partial<AddUserFormValues>) => {
    if (!selectedEditUser) {
      message.warning('Əvvəlcə işçi seçin.');
      return;
    }

    const userId = selectedEditUser.id || selectedEditUser.email;

    try {
      setEditSubmitLoading(true);
      message.loading({ key: 'employee-edit-save', content: 'Məlumatlar yadda saxlanılır...', duration: 0 });
      const mergedValues = {
        firstName: preserveExistingValue(values.firstName, selectedEditUser.firstName),
        lastName: preserveExistingValue(values.lastName, selectedEditUser.lastName),
        middleName: preserveExistingValue(values.middleName, selectedEditUser.middleName),
        jobTitle: preserveExistingValue(values.jobTitle, selectedEditUser.jobTitle),
        phone1: preserveExistingValue(values.phone1, normalizePhoneForInput(selectedEditUser.phone1)),
        phone2: preserveExistingValue(values.phone2, normalizePhoneForInput(selectedEditUser.phone2)),
        whatsapp: preserveExistingValue(values.whatsapp, normalizePhoneForInput(selectedEditUser.whatsapp)),
        extensionNumber: preserveExistingValue(values.extensionNumber, selectedEditUser.extensionNumber),
        linkedin: preserveExistingValue(values.linkedin, socialValueFromUser(selectedEditUser, 'linkedin')),
        facebook: preserveExistingValue(values.facebook, socialValueFromUser(selectedEditUser, 'facebook')),
        instagram: preserveExistingValue(values.instagram, socialValueFromUser(selectedEditUser, 'instagram')),
        photo: editPhotoPreview || preserveExistingValue(values.photo, selectedEditUser.photo || selectedEditUser.photoUrl),
        photoUrl: preserveExistingValue(values.photoUrl, selectedEditUser.photoUrl || selectedEditUser.photo),
        photoData: normalizeInlineImageData(editPhotoPreview || values.photoData || values.photo || selectedEditUser.photoData || selectedEditUser.photo),
        additionalInfo: stripSocialLinksFromAdditionalInfo(
          preserveExistingValue(values.additionalInfo, selectedEditUser.additionalInfo),
          [
            preserveExistingValue(values.linkedin, socialValueFromUser(selectedEditUser, 'linkedin')),
            preserveExistingValue(values.facebook, socialValueFromUser(selectedEditUser, 'facebook')),
            preserveExistingValue(values.instagram, socialValueFromUser(selectedEditUser, 'instagram')),
          ],
        ),
        dateOfBirth: normalizeBirthDateForBackend(preserveExistingValue(values.dateOfBirth, selectedEditUser.dateOfBirth)),
        address: preserveExistingValue(values.address, selectedEditUser.address),
        googleMapsUrl: preserveExistingValue(values.googleMapsUrl, selectedEditUser.googleMapsUrl),
        cardBackgroundUrl: preserveExistingValue(values.cardBackgroundUrl, selectedEditUser.cardBackgroundUrl),
        cardBackgroundFile: values.cardBackgroundFile,
        socialAccounts: values.socialAccounts ?? selectedEditUser.socialAccounts ?? [],
      };

      saveEmployeeLinkSnapshot(selectedEditUser, mergedValues);

      await updateUser(userId, {
        ...mergedValues,
        phone1: normalizePhoneForBackend(mergedValues.phone1),
        phone2: normalizePhoneForBackend(mergedValues.phone2),
        whatsapp: normalizePhoneForBackend(mergedValues.whatsapp),
        photoFile: editPhotoFile || undefined,
      }, selectedEditUser);
      closeEditModal();
    } finally {
      setEditSubmitLoading(false);
    }
  };

  const openResetPasswordModal = (user: UserData) => {
    setResetPasswordUser(user);
    resetPasswordForm.resetFields();
  };

  const closeResetPasswordModal = () => {
    setResetPasswordUser(null);
    setResetPasswordLoading(false);
    resetPasswordForm.resetFields();
  };

  const handleResetPassword = async (values: { newPassword: string }) => {
    if (!resetPasswordUser) {
      message.warning('Əvvəlcə işçi seçin.');
      return;
    }

    try {
      setResetPasswordLoading(true);
      await resetUserPassword(resetPasswordUser.id || resetPasswordUser.email, values.newPassword, resetPasswordUser);
      closeResetPasswordModal();
    } finally {
      setResetPasswordLoading(false);
    }
  };

  const handleDownloadVcf = async (user: UserData) => {
    try {
      setVcfLoadingId(user.id);
      await exportImportActions.downloadVcf(user.id);
      message.success('VCF kontakt faylı yükləndi.');
    } catch {
      const profile = normalizeUserToPublicProfile(user, company);
      await downloadVCard(profile);
      message.info('API VCF vermədi, lokal VCF yaradıldı.');
    } finally {
      setVcfLoadingId(null);
    }
  };


  const handleViewPublicCard = (user: UserData) => {
    const identity = user.id || user.email;
    if (!identity) {
      message.warning('İşçinin public card ID-si tapılmadı.');
      return;
    }

    savePublicCardProfilesFromUsers([user], company);
    const publicUrl = getPublicCardUrl(identity, 'Direct');
    window.open(publicUrl, '_blank', 'noopener,noreferrer');
  };

  const handleStatusTabChange = (value: string | number) => {
    setEmployeeStatusTab(value as EmployeeStatusTab);
    setVisibleEmployeeCount(EMPLOYEE_BATCH_SIZE);
  };


  return (
    <>
      <div className={`business-card-shell pro-page pro-business-card-page ${detailOnly ? 'employee-detail-shell' : ''}`}>
        {!detailOnly && (
          <BusinessCardToolbar
            activeUsersCount={activeUsers.length}
            archivedUsersCount={archivedUsers.length}
            currentEmployeesCount={currentEmployeesCount}
            employeeLimit={company.employeeLimit}
            isLimitReached={isLimitReached}
            onOpenAdd={openAddModal}
          />
        )}

        <EmployeesTable
          employeeStatusTab={employeeStatusTab}
          activeUsersCount={activeUsers.length}
          archivedUsersCount={archivedUsers.length}
          tableRows={tableRows}
          hasMore={hasMoreEmployees}
          onLoadMore={loadMoreEmployees}
          company={company}
          companyLogo={company.logo}
          companyCardBackground={companyCardBackground}
          protectedAdminKeys={protectedAdminKeys}
          vcfLoadingId={vcfLoadingId}
          onStatusTabChange={handleStatusTabChange}
          onOpenEditUser={openEditUser}
          onToggleUserStatus={toggleUserStatus}
          onToggleUserCanEdit={toggleUserCanEdit}
          onDownloadVcf={handleDownloadVcf}
          onViewPublicCard={handleViewPublicCard}
          onOpenResetPassword={openResetPasswordModal}
        />
      </div>

      <AddEmployeeModal
        form={form}
        isOpen={isModalOpen}
        submitLoading={submitLoading}
        photoPreview={photoPreview}
        onClose={closeAddModal}
        onSubmit={handleAddUser}
        onPhotoSelect={handlePhotoSelect}
      />

      <EditEmployeeModal
        form={editForm}
        isOpen={isEditModalOpen}
        companyUsers={companyUsers}
        selectedEditUser={selectedEditUser}
        selectedEditUserId={selectedEditUserId}
        editPhotoPreview={editPhotoPreview}
        editSubmitLoading={editSubmitLoading}
        onClose={closeEditModal}
        onSubmit={handleEditUser}
        onPhotoSelect={handleEditPhotoSelect}
        onOpenUser={openEditUser}
        companyName={company.name}
      />


      <Modal
        title={
          <div>
            <KeyOutlined style={{ marginRight: 8, color: '#4b9ada' }} />
            İşçinin kodunu dəyiş
          </div>
        }
        open={Boolean(resetPasswordUser)}
        onCancel={closeResetPasswordModal}
        footer={null}
        destroyOnHidden
        forceRender
      >
        <p style={{ color: '#64748b', marginTop: 0 }}>
          {resetPasswordUser ? `${resetPasswordUser.firstName} ${resetPasswordUser.lastName}`.trim() || resetPasswordUser.email : ''} üçün yeni kod/şifrə təyin edin.
        </p>
        <Form form={resetPasswordForm} layout="vertical" onFinish={handleResetPassword}>
          <Form.Item
            name="newPassword"
            label="Yeni kod/şifrə"
            rules={[{ required: true, message: 'Yeni kod/şifrə mütləqdir' }, { min: 6, message: 'Ən azı 6 simvol olmalıdır' }]}
          >
            <Input.Password autoComplete="new-password" />
          </Form.Item>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <Button onClick={closeResetPasswordModal}>Ləğv et</Button>
            <Button type="primary" htmlType="submit" loading={resetPasswordLoading}>
              Kodu dəyiş
            </Button>
          </div>
        </Form>
      </Modal>

    </>
  );
}
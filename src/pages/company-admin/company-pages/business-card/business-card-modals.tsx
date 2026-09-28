import { useState, type ChangeEvent } from 'react';
import { Avatar, Checkbox, Form, Input, Modal, Space, Switch, Upload } from 'antd';
import { message } from '../../../../utils/antd-static';
import {CalendarOutlined,CreditCardOutlined,DeleteOutlined,DownloadOutlined,EditOutlined,EnvironmentOutlined,FacebookOutlined,FileExcelOutlined,GlobalOutlined,Html5Outlined,ImportOutlined,InstagramOutlined,LinkOutlined,LinkedinOutlined,MailOutlined,PhoneOutlined,PlusOutlined,SendOutlined,TikTokOutlined,UploadOutlined,UserOutlined,WhatsAppOutlined,XOutlined,YoutubeOutlined,} from '@ant-design/icons';
import type { AddUserFormValues } from '../../../../types/company-admin.type';
import type { EditableProfileValues } from '../../../../types/layout.type';
import CompanyAdminProfileView from '../../../../components/company-admin-profile-view';
import { PhoneCountryInput } from '../../../../components/phone-country-input';
import { getEmployeeFullName, userIdentity } from '../../../../features/company-admin/business-card';
import { AppButton } from '../../../../components/ui/app-button';
import type { AddEmployeeModalProps, BirthDateInputProps, EditEmployeeModalProps, HtmlExportModalProps, ImportEmployeesModalProps } from '../../../../types/business-card.type';

const EMPLOYEE_LINK_PRESETS = [
  { name: 'Telefon', category: 'contact', icon: <PhoneOutlined />, helper: 'Telefon nömrəsini daxil edin.' },
  { name: 'E-poçt', category: 'contact', icon: <MailOutlined />, helper: 'E-poçt ünvanını daxil edin.' },
  { name: 'Ünvan', category: 'contact', icon: <EnvironmentOutlined />, helper: 'Ünvan və ya Google Maps linkini daxil edin.' },
  { name: 'Görüş', category: 'contact', icon: <CalendarOutlined />, helper: 'Görüş və ya rezervasiya linkini daxil edin.' },
  { name: 'Instagram', category: 'social', icon: <InstagramOutlined />, helper: 'Instagram profilini daxil edin.' },
  { name: 'LinkedIn', category: 'social', icon: <LinkedinOutlined />, helper: 'LinkedIn profilini daxil edin.' },
  { name: 'Facebook', category: 'social', icon: <FacebookOutlined />, helper: 'Facebook profilini daxil edin.' },
  { name: 'X', category: 'social', icon: <XOutlined />, helper: 'X profilini daxil edin.' },
  { name: 'YouTube', category: 'social', icon: <YoutubeOutlined />, helper: 'YouTube kanal linkini daxil edin.' },
  { name: 'Telegram', category: 'social', icon: <SendOutlined />, helper: 'Telegram istifadəçi adını və ya linkini daxil edin.' },
  { name: 'TikTok', category: 'social', icon: <TikTokOutlined />, helper: 'TikTok profilini daxil edin.' },
  { name: 'WhatsApp', category: 'social', icon: <WhatsAppOutlined />, helper: 'WhatsApp nömrəsini daxil edin.' },
  { name: 'Sayt', category: 'business', icon: <GlobalOutlined />, helper: 'Şirkət və ya şəxsi sayt linkini daxil edin.' },
  { name: 'Kart hesabı', category: 'business', icon: <CreditCardOutlined />, helper: 'IBAN yazın; kartda toxunanda kopyalansın.' },
  { name: 'Özəl link', category: 'business', icon: <LinkOutlined />, helper: 'İstənilən əlavə linki daxil edin.' },
] as const;

const getPresetIcon = (platformName?: string) => {
  const normalized = String(platformName || '').trim().toLowerCase();
  return EMPLOYEE_LINK_PRESETS.find((preset) => preset.name.toLowerCase() === normalized)?.icon;
};

const directContactPlatform = (platformName?: string) => {
  const key = String(platformName || '').trim().toLowerCase();
  if (key.includes('telefon') || key.includes('phone') || key === 'tel') return 'phone';
  if (key.includes('email') || key.includes('mail')) return 'email';
  if (key.includes('mesaj') || key.includes('message') || key.includes('sms')) return 'message';
  if (key.includes('whatsapp')) return 'whatsapp';
  return '';
};

const linkPlaceholderForPlatform = (platformName?: string) => {
  const platform = String(platformName || '').trim().toLowerCase();
  const directType = directContactPlatform(platformName);
  if (directType === 'phone' || directType === 'message' || directType === 'whatsapp') return '+994 50 000 00 00';
  if (directType === 'email') return 'example@mail.com';
  if (platform.includes('telegram')) return '@istifadəçi_adı və ya t.me/...';
  if (platform.includes('kart hesab') || platform.includes('iban')) return 'AZ00 XXXX 0000 0000 0000 0000 0000';
  if (platform.includes('ünvan') || platform.includes('address')) return 'Ünvan və ya Google Maps linki';
  if (platform.includes('görüş') || platform.includes('meeting')) return 'Görüş / rezervasiya linki';
  if (platform.includes('cv') || platform.includes('pdf')) return 'https://.../cv.pdf';
  return 'https://...';
};

const normalizeLinkValueForPlatform = (platformName: string, value?: string) => {
  const text = String(value || '').trim();
  if (!text) return '';
  const key = String(platformName || '').trim().toLowerCase();
  const directType = directContactPlatform(platformName);

  if (/^https?:\/\/?$/i.test(text)) return '';
  if (directType === 'phone') return /^tel:/i.test(text) ? text : `tel:${text.replace(/^https?:\/\//i, '')}`;
  if (directType === 'email') return /^mailto:/i.test(text) ? text : `mailto:${text.replace(/^https?:\/\//i, '')}`;
  if (directType === 'message') return text.replace(/^(https?:\/\/|sms:)/i, '');
  if (directType === 'whatsapp') {
    if (/^https?:\/\//i.test(text)) return text;
    return `https://wa.me/${text.replace(/\D/g, '')}`;
  }
  if (key.includes('telegram') && text.startsWith('@')) return `https://t.me/${text.slice(1)}`;
  if (key.includes('instagram') && !/^https?:\/\//i.test(text)) return `https://instagram.com/${text.replace(/^@/, '')}`;
  if (key.includes('facebook') && !/^https?:\/\//i.test(text)) return `https://facebook.com/${text.replace(/^@/, '')}`;
  if (key === 'x' && !/^https?:\/\//i.test(text)) return `https://x.com/${text.replace(/^@/, '')}`;
  if (key.includes('tiktok') && !/^https?:\/\//i.test(text)) return `https://tiktok.com/@${text.replace(/^@/, '')}`;
  if (key.includes('youtube') && text.startsWith('@')) return `https://youtube.com/${text}`;
  if (key.includes('ünvan') && !/^https?:\/\//i.test(text)) return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(text)}`;
  return text;
};

const birthDateForDisplay = (value?: string) => {
  const text = String(value || '').trim();
  const isoMatch = text.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) return `${isoMatch[3]}-${isoMatch[2]}-${isoMatch[1]}`;
  return text.replace(/\//g, '-');
};

const isValidBirthDate = (value?: string) => {
  const text = birthDateForDisplay(value);
  if (!text) return true;

  const match = text.match(/^(\d{2})-(\d{2})-(\d{4})$/);
  if (!match) return false;

  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    year >= 1900 &&
    year <= new Date().getFullYear() &&
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
};

function BirthDateInput({ id, value, onChange }: BirthDateInputProps) {
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const digits = event.target.value.replace(/\D/g, '').slice(0, 8);
    const parts = [digits.slice(0, 2), digits.slice(2, 4), digits.slice(4, 8)].filter(Boolean);
    onChange?.(parts.join('-'));
  };

  return (
    <Input
      id={id}
      name={id || 'dateOfBirth'}
      aria-label="Doğum tarixi"
      value={birthDateForDisplay(value)}
      onChange={handleChange}
      placeholder="GG-AA-İİİİ"
      inputMode="numeric"
      maxLength={10}
      autoComplete="off"
    />
  );
}

function EmployeeCardFields() {
  const form = Form.useFormInstance<AddUserFormValues>();
  const [pickerIndex, setPickerIndex] = useState<number | null>(null);
  const [pickerStep, setPickerStep] = useState<'picker' | 'details'>('picker');
  const [selectedPresetName, setSelectedPresetName] = useState('Özəl link');
  const [pickerValue, setPickerValue] = useState('');
  const watchedSocialAccounts = Form.useWatch('socialAccounts', form) || [];
  const addedPlatformLabels = Array.from(new Set(
    watchedSocialAccounts
      .map((item) => String(item?.platformName || '').trim())
      .filter(Boolean),
  ));

  const openEmployeeLinkPicker = (index: number) => {
    const account = (form.getFieldValue('socialAccounts') || [])[index] || {};
    setPickerIndex(index);
    setPickerStep('picker');
    setSelectedPresetName(String(account.platformName || '').trim() || 'Özəl link');
    setPickerValue(String(account.profileUrl || '').trim());
  };

  const chooseIcon = (platformName: string) => {
    if (pickerIndex === null) return;
    const accounts = [...(form.getFieldValue('socialAccounts') || [])];
    const current = accounts[pickerIndex] || {};
    setSelectedPresetName(platformName);
    setPickerValue(normalizeLinkValueForPlatform(platformName, current.profileUrl));
    setPickerStep('details');
  };

  const savePickedLink = () => {
    if (pickerIndex === null) return;
    const value = String(pickerValue || '').trim();
    if (!value) {
      message.warning('Link və ya əlaqə məlumatını daxil edin.');
      return;
    }
    const accounts = [...(form.getFieldValue('socialAccounts') || [])];
    accounts[pickerIndex] = {
      ...(accounts[pickerIndex] || {}),
      platformName: selectedPresetName,
      profileUrl: normalizeLinkValueForPlatform(selectedPresetName, value),
      iconUrl: '',
    };
    form.setFieldValue('socialAccounts', accounts);
    setPickerIndex(null);
    setPickerStep('picker');
  };

  return (
    <div className="employee-card-extra-fields">
      <Form.Item name="cardBackgroundUrl" hidden><Input /></Form.Item>
      <Form.Item name="cardBackgroundFile" hidden><Input /></Form.Item>

      <div className="employee-form-section-title">Əlavə məlumatlar</div>

      <Form.Item label="Arxa fon" className="employee-background-field">
        <Upload
          accept="image/png,image/jpeg,image/svg+xml"
          maxCount={1}
          showUploadList={false}
          beforeUpload={(file) => {
            form.setFieldValue('cardBackgroundFile', file as File);
            const reader = new FileReader();
            reader.onload = () => form.setFieldValue('cardBackgroundUrl', String(reader.result || ''));
            reader.readAsDataURL(file as File);
            return false;
          }}
        >
          <AppButton icon={<UploadOutlined />}>Fon seç</AppButton>
        </Upload>
      </Form.Item>

      <div className="employee-card-details-grid employee-social-fields-under-background">
        <Form.Item name="linkedin" label="LinkedIn">
          <Input prefix={<LinkedinOutlined />} placeholder="LinkedIn profil linki" />
        </Form.Item>
        <Form.Item name="facebook" label="Facebook">
          <Input prefix={<FacebookOutlined />} placeholder="Facebook profil linki" />
        </Form.Item>
        <Form.Item name="instagram" label="Instagram">
          <Input prefix={<InstagramOutlined />} placeholder="Instagram profil linki" />
        </Form.Item>
      </div>

      <div className="employee-card-details-grid">
        <Form.Item
          name="dateOfBirth"
          label="Doğum tarixi"
          rules={[
            {
              validator: async (_rule, value) => {
                if (isValidBirthDate(value)) return;
                throw new Error('Tarixi GG-AA-İİİİ formatında düzgün yazın');
              },
            },
          ]}
        >
          <BirthDateInput />
        </Form.Item>
        <Form.Item name="address" label="Ünvan">
          <Input placeholder="Məsələn: Bakı şəhəri, Nizami küçəsi 10" />
        </Form.Item>
      </div>

      <Form.Item name="googleMapsUrl" label="Google Maps ünvan linki">
        <Input prefix={<GlobalOutlined />} placeholder="Google Maps linkini daxil edin" />
      </Form.Item>
      <Form.Item name="additionalInfo" label="Haqqında / əlavə məlumat">
        <Input.TextArea rows={3} placeholder="Qısa məlumat yazın" />
      </Form.Item>

      <Form.List name="socialAccounts">
        {(fields, { add, remove }) => {
          const addNextLink = async () => {
            const accounts: NonNullable<AddUserFormValues['socialAccounts']> = form.getFieldValue('socialAccounts') || [];
            const incompleteIndex = accounts.findIndex((account: NonNullable<AddUserFormValues['socialAccounts']>[number]) => (
              !String(account?.platformName || '').trim() ||
              !String(account?.profileUrl || '').trim()
            ));

            if (incompleteIndex >= 0) {
              try {
                await form.validateFields([
                  ['socialAccounts', incompleteIndex, 'platformName'],
                  ['socialAccounts', incompleteIndex, 'profileUrl'],
                ]);
              } catch {
                message.warning('Əvvəlki linkin məcburi xanalarını doldurun.');
              }
              return;
            }

            const nextIndex = accounts.length;
            add({ platformName: '', profileUrl: '', iconUrl: '' });
            window.setTimeout(() => openEmployeeLinkPicker(nextIndex), 0);
          };

          return (
            <div className="employee-custom-links">
              {fields.map(({ key, name, ...rest }) => {
                const iconUrl = String(watchedSocialAccounts[name]?.iconUrl || '');
                const platformName = String(watchedSocialAccounts[name]?.platformName || '');
                const presetIcon = getPresetIcon(platformName);
                const profileUrlPlaceholder = linkPlaceholderForPlatform(platformName);

                return (
                <div className="employee-custom-link-row" key={key}>
                  <Form.Item
                    {...rest}
                    name={[name, 'platformName']}
                    rules={[{ required: true, whitespace: true, message: 'Boş qalmamalıdır' }]}
                  >
                    <Input autoComplete="off" placeholder="Linkin adı" />
                  </Form.Item>
                  <Form.Item
                    {...rest}
                    name={[name, 'profileUrl']}
                    rules={[{ required: true, whitespace: true, message: 'Boş qalmamalıdır' }]}
                  >
                    <Input autoComplete="off" placeholder={profileUrlPlaceholder} />
                  </Form.Item>
                  <Form.Item {...rest} name={[name, 'iconUrl']} hidden>
                    <Input />
                  </Form.Item>
                  <AppButton
                    className="employee-custom-link-icon-button"
                    icon={iconUrl
                      ? <img src={iconUrl} alt="" />
                      : (presetIcon || <UploadOutlined />)}
                    onClick={() => openEmployeeLinkPicker(name)}
                    aria-label="İkon seç"
                  />
                  <AppButton danger icon={<DeleteOutlined />} onClick={() => remove(name)} aria-label="Linki sil" />
                </div>
                );
              })}
              <AppButton block type="dashed" icon={<PlusOutlined />} onClick={() => void addNextLink()}>
                Yeni link əlavə et
              </AppButton>
            </div>
          );
        }}
      </Form.List>

      <Modal title={null} open={pickerIndex !== null} onCancel={() => setPickerIndex(null)} footer={null} centered width={500} className="ca-platform-modal">
        {pickerStep === 'picker' ? (
          <div className="ca-platform-picker">
            <div className="ca-platform-modal-head"><strong>Platforma əlavə et</strong></div>
            {addedPlatformLabels.length > 0 && (
              <div className="ca-platform-added">
                <span>ARTIQ ƏLAVƏ EDİLİB</span>
                <div>{addedPlatformLabels.map((label) => <b key={label}>{label}</b>)}</div>
              </div>
            )}
            {[
              { key: 'contact', label: 'ƏLAQƏ' },
              { key: 'social', label: 'SOSİAL ŞƏBƏKƏ' },
              { key: 'business', label: 'İŞ VƏ ÖDƏNİŞ' },
            ].map((group) => {
              const rows = EMPLOYEE_LINK_PRESETS.filter((item) => item.category === group.key);
              if (!rows.length) return null;
              return (
                <section className="ca-platform-group" key={group.key}>
                  <h4>{group.label}</h4>
                  <div className="ca-platform-grid">
                    {rows.map((item) => (
                      <button type="button" key={item.name} onClick={() => chooseIcon(item.name)}>
                        <span>{item.icon}</span><strong>{item.name}</strong>
                      </button>
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        ) : (() => {
          const selected = EMPLOYEE_LINK_PRESETS.find((item) => item.name === selectedPresetName) || EMPLOYEE_LINK_PRESETS[EMPLOYEE_LINK_PRESETS.length - 1];
          return (
            <div className="ca-platform-details">
              <div className="ca-platform-details-head"><button type="button" onClick={() => setPickerStep('picker')}>‹</button><strong>{selected.name}</strong></div>
              <div className="ca-platform-info-banner"><span>{selected.icon}</span><p>{selected.helper}</p></div>
              <label>Link / məlumat</label>
              <Input value={pickerValue} placeholder={linkPlaceholderForPlatform(selected.name)} onChange={(event) => setPickerValue(event.target.value)} />
              <div className="ca-platform-preview-label">KARTDA BELƏ GÖRÜNƏCƏK</div>
              <div className="ca-platform-preview-row"><span>{selected.icon}</span><div><small>{selected.name}</small><strong>{pickerValue || linkPlaceholderForPlatform(selected.name)}</strong></div><b>›</b></div>
              <div className="ca-platform-detail-actions"><AppButton onClick={() => setPickerStep('picker')}>Geri</AppButton><AppButton className="force-navy-action" type="primary" onClick={savePickedLink}>Yadda saxla</AppButton></div>
            </div>
          );
        })()}
      </Modal>
    </div>
  );
}

export function AddEmployeeModal({
  form,
  isOpen,
  submitLoading,
  photoPreview,
  onClose,
  onSubmit,
  onPhotoSelect,
}: AddEmployeeModalProps) {
  return (
    <Modal
      title={
        <div>
          <UserOutlined className="mr-2! text-[#4b9ada]!" />
          Yeni işçi əlavə et
        </div>
      }
      open={isOpen}
      onCancel={onClose}
      footer={null}
      destroyOnHidden
      forceRender
      width={430}
      centered
      rootClassName="employee-add-modal"
    >
      <Form className="employee-add-form" form={form} layout="vertical" onFinish={onSubmit} initialValues={{ isActive: true, canEdit: true }}>
        <div className="employee-add-photo-row">
          <Upload
            accept="image/*"
            listType="picture-circle"
            maxCount={1}
            showUploadList={false}
            beforeUpload={(file) => {
              void onPhotoSelect(file as File);
              return false;
            }}
          >
            {photoPreview ? (
              <Avatar src={photoPreview} size={96} className="border! border-slate-200!" />
            ) : (
              <div>
                <UploadOutlined className="text-xl! text-slate-400!" />
                <div className="mt-2 text-xs">Foto yüklə</div>
              </div>
            )}
          </Upload>

          <div>
            <strong>Profil fotosu</strong>
          </div>
        </div>

        <div className="employee-form-section-title">Əsas məlumatlar</div>
        <div className="employee-add-fields">
          <Form.Item name="firstName" label="Ad" rules={[{ required: true, message: 'Mütləqdir' }]}>
            <Input />
          </Form.Item>

          <Form.Item name="lastName" label="Soyad" rules={[{ required: true, message: 'Mütləqdir' }]}>
            <Input />
          </Form.Item>

          <Form.Item name="middleName" label="Ata adı">
            <Input />
          </Form.Item>

          <Form.Item name="jobTitle" label="Vəzifə" rules={[{ required: true, message: 'Mütləqdir' }]}>
            <Input />
          </Form.Item>

          <Form.Item name="email" label="Gmail" rules={[{ required: true, message: 'Mütləqdir' }, { type: 'email', message: 'Email düzgün deyil' }]}>
            <Input />
          </Form.Item>

          <Form.Item name="password" label="Kod/Şifrə" rules={[{ required: true, message: 'Mütləqdir' }]}>
            <Input.Password autoComplete="new-password" />
          </Form.Item>
        </div>

        <div className="employee-form-section-title">Əlaqə</div>
        <div className="employee-add-fields">
          <Form.Item name="phone1" label="İş telefonu" rules={[{ required: true, message: 'Mütləqdir' }]}>
            <PhoneCountryInput placeholder="İş telefonu" maxLength={20} />
          </Form.Item>

          <Form.Item name="phone2" label="Şəxsi telefon">
            <PhoneCountryInput placeholder="Şəxsi telefon" maxLength={20} />
          </Form.Item>

          <Form.Item name="whatsapp" label="WhatsApp">
            <PhoneCountryInput placeholder="WhatsApp nömrəsi" maxLength={20} />
          </Form.Item>

          <Form.Item name="extensionNumber" label="Daxili nömrə">
            <Input placeholder="400" maxLength={20} />
          </Form.Item>
        </div>

        <EmployeeCardFields />

        <Form.Item name="isActive" label="Status" valuePropName="checked" className="employee-status-field">
          <Switch checkedChildren="Aktiv" unCheckedChildren="Deaktiv" />
        </Form.Item>

        <div className="employee-add-actions">
          <AppButton onClick={onClose}>Ləğv et</AppButton>
          <AppButton type="primary" htmlType="submit" loading={submitLoading} icon={<EditOutlined />}>
            Yadda saxla
          </AppButton>
        </div>
      </Form>
    </Modal>
  );
}

export function EditEmployeeModal({
  form,
  isOpen,
  companyUsers,
  selectedEditUser,
  selectedEditUserId,
  editPhotoPreview,
  editSubmitLoading,
  onClose,
  onSubmit,
  onPhotoSelect,
  onOpenUser,
  companyName,
}: EditEmployeeModalProps) {
  void companyUsers;
  void onOpenUser;
  void editSubmitLoading;

  const employeeFullName = selectedEditUser ? getEmployeeFullName(selectedEditUser) : '';
  const employeeInitials = employeeFullName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'U';

  const initialProfileValues: EditableProfileValues | undefined = selectedEditUser ? {
    firstName: selectedEditUser.firstName || '',
    lastName: selectedEditUser.lastName || '',
    middleName: selectedEditUser.middleName || '',
    jobTitle: selectedEditUser.jobTitle || '',
    phone1: selectedEditUser.phone1 || '',
    phone2: selectedEditUser.phone2 || '',
    whatsappPhone: selectedEditUser.whatsapp || '',
    extensionNumber: selectedEditUser.extensionNumber || '',
    dateOfBirth: selectedEditUser.dateOfBirth || '',
    additionalInfo: selectedEditUser.additionalInfo || '',
    photoUrl: editPhotoPreview || selectedEditUser.photoUrl || selectedEditUser.photo || '',
    googleMapsUrl: selectedEditUser.googleMapsUrl || '',
    linkedinUrl: selectedEditUser.linkedin || '',
    facebookUrl: selectedEditUser.facebook || '',
    instagramUrl: selectedEditUser.instagram || '',
    cardBackgroundUrl: selectedEditUser.cardBackgroundUrl || '',
    socialAccounts: selectedEditUser.socialAccounts || [],
  } : undefined;

  const saveEmployeeProfile = async (values: EditableProfileValues) => {
    form.setFieldsValue({
      firstName: values.firstName,
      lastName: values.lastName,
      middleName: values.middleName,
      jobTitle: values.jobTitle,
      phone1: values.phone1,
      phone2: values.phone2,
      whatsapp: values.whatsappPhone,
      extensionNumber: values.extensionNumber,
      dateOfBirth: values.dateOfBirth,
      additionalInfo: values.additionalInfo,
      googleMapsUrl: values.googleMapsUrl,
      linkedin: values.linkedinUrl,
      facebook: values.facebookUrl,
      instagram: values.instagramUrl,
      cardBackgroundUrl: values.cardBackgroundUrl,
      socialAccounts: values.socialAccounts,
    });

    await onSubmit({
      ...form.getFieldsValue(),
      firstName: values.firstName,
      lastName: values.lastName,
      middleName: values.middleName,
      jobTitle: values.jobTitle,
      phone1: values.phone1,
      phone2: values.phone2,
      whatsapp: values.whatsappPhone,
      extensionNumber: values.extensionNumber,
      dateOfBirth: values.dateOfBirth,
      additionalInfo: values.additionalInfo,
      googleMapsUrl: values.googleMapsUrl,
      linkedin: values.linkedinUrl,
      facebook: values.facebookUrl,
      instagram: values.instagramUrl,
      cardBackgroundUrl: values.cardBackgroundUrl,
      socialAccounts: values.socialAccounts,
    });
  };

  const uploadEmployeeBackground = async (file: File) => {
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ''));
      reader.onerror = () => reject(new Error('Fon şəklini oxumaq mümkün olmadı.'));
      reader.readAsDataURL(file);
    });
    form.setFieldsValue({ cardBackgroundFile: file, cardBackgroundUrl: dataUrl });
    return dataUrl;
  };

  return (
    <Modal
      rootClassName="employee-edit-modal employee-edit-profile-modal"
      open={isOpen}
      onCancel={onClose}
      footer={null}
      destroyOnHidden
      width={430}
      centered
      title={null}
      styles={{ body: { padding: 0, maxHeight: '88vh', overflowY: 'auto', background: '#f3f5f3' } }}
    >
      {!selectedEditUser || !initialProfileValues ? (
        <div className="p-6 text-[#6e7671]">Redaktə üçün işçi seçin.</div>
      ) : (
        <CompanyAdminProfileView
          key={selectedEditUserId || selectedEditUser.id || selectedEditUser.email}
          displayName={employeeFullName}
          companyName={companyName}
          avatarSrc={editPhotoPreview || selectedEditUser.photoUrl || selectedEditUser.photo || undefined}
          initials={employeeInitials}
          initialValues={initialProfileValues}
          initialEditing
          onCancelEdit={onClose}
          successMessage="İşçi məlumatları yeniləndi."
          onSave={saveEmployeeProfile}
          onUploadPhoto={async (file) => { await onPhotoSelect(file); }}
          onUploadCardBackground={uploadEmployeeBackground}
        />
      )}
    </Modal>
  );
}

export function HtmlExportModal({
  isOpen,
  exportableUsers,
  selectedHtmlExportIds,
  exportLoading,
  setSelectedHtmlExportIds,
  onClose,
  onExportSelectedHtml,
}: HtmlExportModalProps) {
  return (
    <Modal
      title={
        <div>
          <Html5Outlined className="mr-2! text-[#5aa8e8]!" />
          Offline HTML ixracı
        </div>
      }
      open={isOpen}
      onCancel={onClose}
      footer={null}
      destroyOnHidden
      centered
      width={640}
    >
      <Space className="mb-3!" wrap>
        <AppButton onClick={() => setSelectedHtmlExportIds(exportableUsers.map(userIdentity))}>Hamısını seç</AppButton>
        <AppButton onClick={() => setSelectedHtmlExportIds([])}>Seçimi təmizlə</AppButton>
      </Space>

      <div className="mb-4 max-h-260px overflow-auto rounded-xl border border-slate-200 p-3">
        <Checkbox.Group
          className="grid gap-2"
          value={selectedHtmlExportIds}
          onChange={(values) => setSelectedHtmlExportIds(values.map(String))}
        >
          {exportableUsers.map((user) => {
            const identity = userIdentity(user);
            return (
              <Checkbox key={identity} value={identity}>
                <strong>{getEmployeeFullName(user)}</strong> <span className="text-slate-400">— {user.jobTitle || user.email}</span>
              </Checkbox>
            );
          })}
        </Checkbox.Group>
      </div>

      <div className="flex justify-end gap-2.5">
        <AppButton onClick={onClose}>Bağla</AppButton>
        <AppButton
          type="primary"
          icon={<DownloadOutlined />}
          loading={exportLoading === 'htmlSelected'}
          disabled={selectedHtmlExportIds.length === 0}
          onClick={onExportSelectedHtml}
        >
          Seçilənləri yüklə
        </AppButton>
      </div>
    </Modal>
  );
}

export function ImportEmployeesModal({
  isOpen,
  importFile,
  importResult,
  importLoading,
  templateLoading,
  isLimitReached,
  currentEmployeesCount,
  employeeLimit,
  setImportFile,
  setImportResult,
  onClose,
  onDownloadTemplate,
  onImportSubmit,
}: ImportEmployeesModalProps) {
  return (
    <Modal
      title={
        <div>
          <ImportOutlined className="mr-2! text-[#4b9ada]!" />
          Kütləvi işçi idxalı (CSV/Excel)
        </div>
      }
      open={isOpen}
      onCancel={onClose}
      footer={null}
      destroyOnHidden
      centered
      width={520}
    >
      <div className="mb-4 rounded-[10px] border border-slate-200 bg-slate-50 p-4">
        <strong>1. Boş şablonu yükləyin</strong>
        <br />
        <AppButton icon={<FileExcelOutlined className="text-[#5aa8e8]!" />} onClick={onDownloadTemplate} loading={templateLoading} className="mt-2.5!">
          Şablonu yüklə
        </AppButton>
      </div>

      <div className="mb-4 rounded-[10px] border border-slate-200 bg-slate-50 p-4">
        <strong>2. Doldurulmuş CSV/Excel faylını seçin</strong>

        <Upload
          accept=".csv,.xlsx,.xls"
          maxCount={1}
          beforeUpload={(file) => {
            setImportFile(file);
            setImportResult(null);
            return false;
          }}
          onRemove={() => {
            setImportFile(null);
            setImportResult(null);
          }}
          fileList={importFile ? [{ uid: '-1', name: importFile.name, status: 'done' as const }] : []}
        >
          <AppButton icon={<UploadOutlined />} className="mt-2.5! w-full!">
            CSV/Excel faylını seç
          </AppButton>
        </Upload>
      </div>

      {importResult && (
        <div className="mb-4 rounded-[10px] border border-green-200 bg-green-50 p-3 text-green-700">
          {importResult.success} işçi uğurla idxal edildi.

          {importResult.errors.length > 0 && (
            <ul className="mt-2 pl-4 text-[#6d7f8d]">
              {importResult.errors.map((error) => (
                <li key={error}>{error}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="mb-5 rounded-lg border border-[#cde6f8] bg-[#f6fbff] p-3 text-[#527086]">
        Şirkət limiti: <strong>{currentEmployeesCount}/{employeeLimit}</strong>
      </div>

      <div className="flex justify-end gap-2.5">
        <AppButton onClick={onClose}>Ləğv et</AppButton>

        <AppButton
          type="primary"
          icon={<ImportOutlined />}
          loading={importLoading}
          disabled={!importFile || !!importResult || isLimitReached}
          onClick={onImportSubmit}
        >
          İdxal et
        </AppButton>
      </div>
    </Modal>
  );
}

import { useEffect, useMemo, useState } from 'react';
import { Form, Input, message, Switch, Upload } from 'antd';
import { useCompanyAdmin } from '../../../hooks/use-company-admin';
import { useAuthSelector } from '../../../store/authStore';
import { getStoredUser } from '../../../storage/auth.storage';
import type { CompanyFormValues, UserData } from '../../../types/company-admin.type';
import { AppButton } from '../../../components/ui/app-button';

function CompanyLogoPreview({ src, name }: { src?: string; name: string }) {
  const [failedSrc, setFailedSrc] = useState('');
  const initials = (name || 'Ş').split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || 'Ş';
  const canShowImage = Boolean(src) && failedSrc !== src;

  return (
    <span className="ca-settings-logo">
      {canShowImage ? (
        <img src={src} alt={name || 'Şirkət loqosu'} onError={() => setFailedSrc(src || '')} />
      ) : initials}
    </span>
  );
}

const recordText = (source: Record<string, unknown> | null, keys: string[]) => {
  if (!source) return '';
  for (const key of keys) {
    const value = source[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return '';
};

const employeeName = (user: UserData) =>
  `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email || 'Əməkdaş';

export default function CompanyInfo() {
  const { company, usersList, saveCompany, uploadCompanyLogo, toggleUserCanEdit } = useCompanyAdmin();
  const [companyForm] = Form.useForm<CompanyFormValues>();
  const [saving, setSaving] = useState(false);
  const [switchingId, setSwitchingId] = useState('');
  const authUserId = useAuthSelector((state) => state.userId);
  const accountInfo = useAuthSelector((state) => state.accountInfo);
  const storedUser = getStoredUser();

  useEffect(() => {
    companyForm.setFieldsValue({
      name: company.name,
      industry: company.industry,
      address: company.address,
      contact: company.contact,
      email: company.email,
      phone: company.phone,
      nfcBaseUrl: company.nfcBaseUrl,
    });
  }, [company, companyForm]);

  const adminKeys = useMemo(() => new Set([
    authUserId,
    storedUser?.userId,
    storedUser?.id,
    storedUser?.email,
    recordText(accountInfo, ['id', 'userId', 'email', 'gmail']),
  ].map((value) => String(value || '').trim().toLowerCase()).filter(Boolean)), [accountInfo, authUserId, storedUser?.email, storedUser?.id, storedUser?.userId]);

  const adminUser = useMemo(() => usersList.find((user) => {
    const role = String(user.role || '').toLowerCase();
    if (role === 'company-admin' || role === 'companyadmin' || role === '1') return true;
    return [user.id, user.email].some((value) => adminKeys.has(String(value || '').toLowerCase()));
  }), [adminKeys, usersList]);

  const adminName = adminUser
    ? employeeName(adminUser)
    : [recordText(accountInfo, ['firstName', 'name']), recordText(accountInfo, ['lastName', 'surname'])].filter(Boolean).join(' ') || storedUser?.email || 'Şirkət admini';

  const editableEmployees = useMemo(() => usersList.filter((user) => {
    if (user.isActive === false) return false;
    if (adminUser && (user.id === adminUser.id || user.email === adminUser.email)) return false;
    return ![user.id, user.email].some((value) => adminKeys.has(String(value || '').toLowerCase()));
  }), [adminKeys, adminUser, usersList]);

  const handleSubmit = async (values: CompanyFormValues) => {
    setSaving(true);
    try {
      await saveCompany({
        name: values.name,
        nfcBaseUrl: values.nfcBaseUrl,
        industry: company.industry,
        address: company.address,
        contact: company.contact,
        email: company.email,
        phone: company.phone,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="ca-reference-page ca-settings-page">
      <section className="ca-reference-card ca-settings-company-card">
        <h2>Şirkət məlumatları</h2>

        <div className="ca-settings-logo-row">
          <CompanyLogoPreview src={company.logo} name={company.name} />
          <Upload
            showUploadList={false}
            accept="image/png,image/jpeg,image/svg+xml"
            maxCount={1}
            beforeUpload={(file) => {
              const allowed = ['image/png', 'image/jpeg', 'image/svg+xml'].includes(file.type);
              if (!allowed) {
                message.error('Yalnız JPG, PNG və SVG formatında loqo yükləyə bilərsiniz.');
                return Upload.LIST_IGNORE;
              }
              void uploadCompanyLogo(file);
              return false;
            }}
          >
            <AppButton>Loqo yüklə</AppButton>
          </Upload>
        </div>

        <Form layout="vertical" form={companyForm} onFinish={(values) => void handleSubmit(values)}>
          <Form.Item
            label="Şirkətin adı"
            name="name"
            rules={[{ required: true, message: 'Şirkətin adını yazın.' }, { max: 100, message: 'Maksimum 100 simvol.' }]}
          >
            <Input maxLength={100} showCount />
          </Form.Item>

          <Form.Item
            label="NFC Base URL"
            name="nfcBaseUrl"
            rules={[{ type: 'url', warningOnly: true, message: 'Düzgün URL yazın.' }]}
          >
            <Input placeholder="https://www.setclapp.com/m/v/" />
          </Form.Item>
          <p className="ca-settings-hint">Kartlara yazılan ünvanın əvvəli. Dəyişsəniz, köhnə kartlar yeni ünvana yönlənir.</p>

          <AppButton className="ca-primary-action force-navy-action" type="primary" htmlType="submit" loading={saving} block>
            Yadda saxla
          </AppButton>
        </Form>
      </section>

      <section className="ca-reference-card ca-permissions-card">
        <header>
          <h2>Redaktə icazələri</h2>
          <p>İcazəsi olan əməkdaş öz vizitkartını dəyişə bilər</p>
        </header>

        <article className="ca-permission-row ca-admin-permission-row">
          <div>
            <strong>{adminName}</strong>
            <small>Şirkət admini</small>
          </div>
          <span className="ca-admin-badge">Admin</span>
        </article>

        {editableEmployees.map((user) => {
          const id = String(user.id || user.email);
          return (
            <article className="ca-permission-row" key={id}>
              <strong>{employeeName(user)}</strong>
              <Switch
                checked={Boolean(user.canEdit)}
                loading={switchingId === id}
                onChange={() => {
                  setSwitchingId(id);
                  void toggleUserCanEdit(id, Boolean(user.canEdit)).finally(() => setSwitchingId(''));
                }}
              />
            </article>
          );
        })}
      </section>
    </div>
  );
}

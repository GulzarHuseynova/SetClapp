import type { ReactNode } from 'react';
import { CalendarOutlined, ContactsOutlined, CreditCardOutlined, EditOutlined, EnvironmentOutlined, FacebookOutlined, GlobalOutlined, InstagramOutlined, KeyOutlined, LinkOutlined, LinkedinOutlined, LoadingOutlined, MailOutlined, MessageOutlined, PhoneOutlined, QrcodeOutlined, SendOutlined, TikTokOutlined, UserOutlined, WhatsAppOutlined, XOutlined, YoutubeOutlined, } from '@ant-design/icons';
import { Avatar, Switch } from 'antd';
import type { ProfileSocialAccount } from '../types/layout.type';
import type { PublicCardProfile } from '../types/public-card.type';
import { AppButton } from './ui/app-button';

const clean = (value?: string | null) => {
  const text = String(value ?? '').trim();
  return text && text.toLowerCase() !== 'string' ? text : '';
};

const markerFor = (platformName?: string, profileUrl?: string) =>
  `${clean(platformName)} ${clean(profileUrl)}`.toLowerCase();

const normalizeHref = (value?: string, platformName?: string) => {
  const text = clean(value);
  const platform = markerFor(platformName, value);

  if (!text || /^(https?:\/\/|mailto:|tel:|sms:)/i.test(text)) return text;
  if (platform.includes('telefon') || platform.includes('phone')) return `tel:${text}`;
  if (platform.includes('email') || platform.includes('mail') || platform.includes('poçt')) return `mailto:${text}`;
  if (platform.includes('mesaj') || platform.includes('message') || platform.includes('sms')) return `sms:${text}`;
  if (platform.includes('whatsapp')) return `https://wa.me/${text.replace(/\D/g, '')}`;
  if (platform.includes('telegram') && text.startsWith('@')) return `https://t.me/${text.slice(1)}`;
  if (platform.includes('kart hesab') || platform.includes('iban')) return '#';

  if ((platform.includes('ünvan') || platform.includes('address')) && !/^https?:\/\//i.test(text)) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(text)}`;
  }

  return `https://${text}`;
};

const platformLabel = (platformName?: string, profileUrl?: string) => {
  const raw = clean(platformName);
  const marker = markerFor(platformName, profileUrl);
  const isGeneric = !raw || /özəl|custom/i.test(raw);

  if (!isGeneric) return raw;
  if (marker.includes('linkedin')) return 'LinkedIn';
  if (marker.includes('facebook')) return 'Facebook';
  if (marker.includes('instagram')) return 'Instagram';
  if (marker.includes('youtube')) return 'YouTube';
  if (marker.includes('tiktok')) return 'TikTok';
  if (marker.includes('whatsapp') || marker.includes('wa.me')) return 'WhatsApp';
  if (marker.includes('telegram') || marker.includes('t.me')) return 'Telegram';
  if (marker.includes('x.com') || marker.includes('twitter')) return 'X';
  if (marker.includes('mailto:')) return 'E-poçt';
  if (marker.includes('tel:')) return 'Telefon';
  if (marker.includes('iban') || marker.includes('kart hesab')) return 'Kart hesabı';
  if (marker.includes('map') || marker.includes('ünvan') || marker.includes('address')) return 'Ünvan';

  return raw || 'Link';
};

const platformIcon = (
  platformName?: string,
  profileUrl?: string,
  iconUrl?: string,
): ReactNode => {
  if (clean(iconUrl)) return <img src={iconUrl} alt="" />;

  const marker = markerFor(platformName, profileUrl);

  if (marker.includes('linkedin')) return <LinkedinOutlined />;
  if (marker.includes('facebook')) return <FacebookOutlined />;
  if (marker.includes('instagram')) return <InstagramOutlined />;
  if (marker === 'x' || marker.includes('twitter') || marker.includes('x.com')) return <XOutlined />;
  if (marker.includes('youtube')) return <YoutubeOutlined />;
  if (marker.includes('tiktok')) return <TikTokOutlined />;
  if (marker.includes('whatsapp')) return <WhatsAppOutlined />;
  if (marker.includes('telegram')) return <SendOutlined />;
  if (marker.includes('kart hesab') || marker.includes('iban')) return <CreditCardOutlined />;
  if (marker.includes('ünvan') || marker.includes('address') || marker.includes('maps')) return <EnvironmentOutlined />;
  if (marker.includes('mesaj') || marker.includes('message') || marker.includes('sms')) return <MessageOutlined />;
  if (marker.includes('email') || marker.includes('mail') || marker.includes('poçt')) return <MailOutlined />;
  if (marker.includes('telefon') || platformName?.toLowerCase().includes('phone') || marker.includes('tel:')) return <PhoneOutlined />;
  if (marker.includes('sayt') || marker.includes('site') || marker.includes('web')) return <GlobalOutlined />;

  return <LinkOutlined />;
};

const isPrimarySocial = (platformName?: string, profileUrl?: string) => {
  const marker = markerFor(platformName, profileUrl);
  return ['linkedin', 'facebook', 'instagram'].some((item) => marker.includes(item));
};

const dedupeAccounts = (accounts: ProfileSocialAccount[]) => {
  const seen = new Set<string>();

  return accounts.filter((account) => {
    const url = clean(account.profileUrl);
    if (!url) return false;

    const key = `${platformLabel(account.platformName, account.profileUrl).toLowerCase()}::${url.toLowerCase()}`;
    if (seen.has(key)) return false;

    seen.add(key);
    return true;
  });
};

const formatBirthDate = (value?: string) => {
  const text = clean(value);
  const match = text.match(/^(\d{4})-(\d{2})-(\d{2})/);
  return match ? `${match[3]}.${match[2]}.${match[1]}` : text;
};

interface BusinessCardActions {
  onEdit?: () => void;
  onAddContact?: () => void | Promise<void>;
  addContactLoading?: boolean;
  contactHref?: string;
  onChangeCode?: () => void;
  onQrCode?: () => void;
}

interface BusinessCardSettings {
  showEditPermission?: boolean;
  canEdit?: boolean;
  onCanEditChange?: (checked: boolean) => void | Promise<void>;
  showStatus?: boolean;
  isActive?: boolean;
  onStatusChange?: (checked: boolean) => void | Promise<void>;
}

export interface BusinessCardViewModel {
  profile: PublicCardProfile;
  actions?: BusinessCardActions;
  settings?: BusinessCardSettings;
}

export interface CommonBusinessCardViewProps {
  card: BusinessCardViewModel;
}

interface ResolvedBusinessCard {
  fullName: string;
  roleLabel: string;
  companyName: string;
  avatarSrc: string;
  initials: string;
  backgroundUrl: string;
  dateOfBirth: string;
  additionalInfo: string;
  phone: string;
  email: string;
  whatsapp: string;
  socialAccounts: ProfileSocialAccount[];
  googleMapsUrl: string;
  address: string;
}

const getPhone = (profile: PublicCardProfile, whatsapp = false) =>
  profile.phones?.find((item) => {
    const isWhatsapp = /whatsapp/i.test(clean(item.type));
    return isWhatsapp === whatsapp && Boolean(clean(item.number));
  })?.number ?? '';

const getAdditionalInfo = (profile: PublicCardProfile) =>
  profile.extras?.find((item) => /əlavə məlumat|haqqında|about/i.test(clean(item.label)))?.value ?? '';

const toSocialAccounts = (profile: PublicCardProfile): ProfileSocialAccount[] =>
  (profile.socials ?? []).map((item) => ({
    platformName: item.platform,
    profileUrl: item.url,
    iconUrl: item.iconUrl,
  }));

const resolveProfile = (profile: PublicCardProfile): ResolvedBusinessCard => {
  const firstName = clean(profile.firstName);
  const lastName = clean(profile.lastName);
  const middleName = clean(profile.middleName);
  const fullName = [firstName, lastName, middleName].filter(Boolean).join(' ');

  return {
    fullName: fullName || clean(profile.email) || 'Əməkdaş',
    roleLabel: clean(profile.jobTitle) || 'İşçi',
    companyName: clean(profile.companyName),
    avatarSrc: clean(profile.photo),
    initials: `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || 'İ',
    backgroundUrl: clean(profile.cardBackground) || clean(profile.companyLogo),
    dateOfBirth: clean(profile.dateOfBirth),
    additionalInfo: clean(getAdditionalInfo(profile)),
    phone: clean(getPhone(profile)),
    email: clean(profile.email),
    whatsapp: clean(getPhone(profile, true)),
    socialAccounts: dedupeAccounts(toSocialAccounts(profile)),
    googleMapsUrl: clean(profile.googleMapsUrl),
    address: clean(profile.address),
  };
};

const resolveContactHref = (phone: string, email: string, customHref?: string) => {
  if (clean(customHref)) return clean(customHref);
  if (clean(phone)) return `tel:${phone}`;
  if (clean(email)) return `mailto:${email}`;
  return undefined;
};

const isCopyOnlyLink = (platformName?: string, profileUrl?: string) => {
  const marker = markerFor(platformName, profileUrl);
  return marker.includes('iban') || marker.includes('kart hesab');
};

export function CommonBusinessCardView({ card }: CommonBusinessCardViewProps) {
  const { profile, actions = {}, settings = {} } = card;
  const view = resolveProfile(profile);

  const {
    onEdit,
    onAddContact,
    addContactLoading = false,
    contactHref,
    onChangeCode,
    onQrCode,
  } = actions;

  const {
    showEditPermission = false,
    canEdit = false,
    onCanEditChange,
    showStatus = false,
    isActive = true,
    onStatusChange,
  } = settings;

  const contactLink = resolveContactHref(view.phone, view.email, contactHref);
  const primarySocials = view.socialAccounts.filter((item) =>
    isPrimarySocial(item.platformName, item.profileUrl),
  );
  const customLinks = view.socialAccounts.filter(
    (item) => !isPrimarySocial(item.platformName, item.profileUrl),
  );

  const hasContacts = Boolean(view.phone || view.email || view.whatsapp);
  const hasSettings = showEditPermission || showStatus;
  const hasBottomActions = Boolean(onChangeCode || onQrCode);
  const hasSingleBottomAction = Number(Boolean(onChangeCode)) + Number(Boolean(onQrCode)) === 1;

  return (
    <article className="common-business-card employee-business-card ca-admin-profile-card">
      <div
        className="ca-admin-profile-cover employee-business-card-cover"
        style={
          view.backgroundUrl
            ? {
              backgroundImage: `linear-gradient(180deg,rgba(255,255,255,.08),rgba(18,51,74,.18)),url("${view.backgroundUrl.replace(/"/g, '%22')}")`,
              backgroundSize: 'contain',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
              backgroundColor: '#f4f8fb',
            }
            : undefined
        }
      />

      <div className="ca-admin-profile-main employee-business-card-body">
        <div className="ca-admin-profile-avatar-wrap">
          <Avatar
            size={112}
            src={view.avatarSrc || undefined}
            icon={!view.avatarSrc ? <UserOutlined /> : undefined}
            className="ca-admin-profile-avatar employee-preview-avatar"
          >
            {!view.avatarSrc ? view.initials : null}
          </Avatar>
        </div>

        {onEdit && (
          <AppButton
            type="primary"
            shape="circle"
            icon={<EditOutlined />}
            onClick={onEdit}
            className="ca-admin-profile-edit-main force-navy-action"
            aria-label="Redaktə et"
            title="Redaktə et"
          />
        )}

        <div className="ca-admin-profile-identity employee-preview-heading">
          <h1>{view.fullName}</h1>
          <p>{view.roleLabel}</p>
          {view.companyName && <strong>{view.companyName}</strong>}
        </div>

        {view.additionalInfo && (
          <div className="ca-admin-profile-bio">{view.additionalInfo}</div>
        )}

        {view.dateOfBirth && (
          <section className="ca-admin-card-section employee-preview-section">
            <div className="ca-admin-business-links">
              <div className="common-business-card-info-row">
                <span className="ca-admin-business-icon">
                  <CalendarOutlined />
                </span>
                <strong>Doğum tarixi: {formatBirthDate(view.dateOfBirth)}</strong>
              </div>
            </div>
          </section>
        )}

        {(onAddContact || contactLink) && (
          <div className="ca-admin-profile-primary-actions employee-preview-primary-actions">
            {onAddContact && (
              <AppButton
                className="ca-white-action-button force-navy-action"
                icon={addContactLoading ? <LoadingOutlined /> : <ContactsOutlined />}
                disabled={addContactLoading}
                onClick={() => void onAddContact()}
              >
                Kontakta əlavə et
              </AppButton>
            )}

            {contactLink && (
              <AppButton
                className="ca-white-action-button force-navy-action"
                icon={<PhoneOutlined />}
                href={contactLink}
              >
                Əlaqə
              </AppButton>
            )}
          </div>
        )}

        {hasContacts && (
          <section className="ca-admin-card-section employee-preview-section">
            <h3>Əlaqə</h3>
            <div className="ca-admin-contact-grid">
              {view.phone && (
                <a href={`tel:${view.phone}`} aria-label="Zəng et">
                  <PhoneOutlined />
                </a>
              )}

              {view.email && (
                <a href={`mailto:${view.email}`} aria-label="E-poçt">
                  <MailOutlined />
                </a>
              )}

              {view.whatsapp && (
                <a
                  href={`https://wa.me/${view.whatsapp.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="WhatsApp"
                >
                  <WhatsAppOutlined />
                </a>
              )}
            </div>
          </section>
        )}

        {primarySocials.length > 0 && (
          <section className="ca-admin-card-section employee-preview-section">
            <h3>Sosial media</h3>
            <div className="ca-admin-social-grid">
              {primarySocials.map((item) => {
                const label = platformLabel(item.platformName, item.profileUrl);
                const url = clean(item.profileUrl);

                return (
                  <a
                    key={`${label}-${url}`}
                    href={normalizeHref(url, item.platformName)}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={label}
                  >
                    {platformIcon(item.platformName, url, item.iconUrl)}
                  </a>
                );
              })}
            </div>
          </section>
        )}

        {customLinks.length > 0 && (
          <section className="ca-admin-card-section employee-preview-section">
            <h3>Linklər</h3>
            <div className="ca-admin-business-links">
              {customLinks.map((item) => {
                const label = platformLabel(item.platformName, item.profileUrl);
                const url = clean(item.profileUrl);
                const copyOnly = isCopyOnlyLink(item.platformName, url);

                return (
                  <a
                    key={`${label}-${url}`}
                    href={copyOnly ? '#' : normalizeHref(url, item.platformName)}
                    target={copyOnly ? undefined : '_blank'}
                    rel={copyOnly ? undefined : 'noreferrer'}
                    onClick={
                      copyOnly
                        ? (event) => {
                          event.preventDefault();
                          void navigator.clipboard?.writeText(url);
                        }
                        : undefined
                    }
                  >
                    <span className="ca-admin-business-icon employee-custom-preview-icon">
                      {platformIcon(item.platformName, url, item.iconUrl)}
                    </span>
                    <strong>{label}</strong>
                  </a>
                );
              })}
            </div>
          </section>
        )}

        {view.googleMapsUrl && (
          <section className="ca-admin-card-section employee-preview-section">
            <h3>Google Maps</h3>
            <div className="ca-admin-business-links">
              <a
                href={normalizeHref(view.googleMapsUrl, 'Ünvan')}
                target="_blank"
                rel="noreferrer"
              >
                <span className="ca-admin-business-icon">
                  <EnvironmentOutlined />
                </span>
                <strong>{view.address || 'Google Maps ünvanı'}</strong>
              </a>
            </div>
          </section>
        )}

        {hasSettings && (
          <div className="employee-preview-settings">
            {showEditPermission && (
              <div>
                <span>Redaktə icazəsi</span>
                <Switch
                  checked={canEdit}
                  onChange={(checked) => void onCanEditChange?.(checked)}
                />
              </div>
            )}

            {showStatus && (
              <div>
                <span>Status</span>
                <Switch
                  checked={isActive}
                  checkedChildren="Aktiv"
                  unCheckedChildren="Deaktiv"
                  onChange={(checked) => void onStatusChange?.(checked)}
                />
              </div>
            )}
          </div>
        )}

        {hasBottomActions && (
          <div className={`employee-preview-actions ${hasSingleBottomAction ? 'is-single' : ''}`}>
            {onChangeCode && (
              <AppButton
                className="ca-white-action-button force-navy-action"
                icon={<KeyOutlined />}
                onClick={onChangeCode}
              >
                Kodu dəyiş
              </AppButton>
            )}

            {onQrCode && (
              <AppButton
                className="ca-white-action-button force-navy-action"
                icon={<QrcodeOutlined />}
                onClick={onQrCode}
              >
                QR kod
              </AppButton>
            )}
          </div>
        )}
      </div>
    </article>
  );
}

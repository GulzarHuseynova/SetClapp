import type { ReactNode } from 'react';
import { CalendarOutlined, ContactsOutlined, EditOutlined, EnvironmentOutlined, KeyOutlined, LoadingOutlined, MailOutlined, PhoneOutlined, QrcodeOutlined, UserOutlined, WhatsAppOutlined } from '@ant-design/icons';
import { Avatar, Switch } from 'antd';
import type { PublicCardProfile } from '../types/public-card.type';
import { AppButton } from './ui/app-button';
import type { AppButtonProps } from '../types/ui.type';
import { cleanText, isCopyOnlyLink, normalizeLinkHref, platformIcon, platformLabel, platformMarker } from './business-card-links';
import type { CardLink, CommonBusinessCardViewProps } from '../types/business-card-view.type';

const PRIMARY_SOCIALS = ['linkedin', 'facebook', 'instagram'];

const toCardLinks = (profile: PublicCardProfile): CardLink[] => {
  const seen = new Set<string>();
  const links: CardLink[] = [];

  (profile.socials ?? []).forEach(({ platform, url: rawUrl, iconUrl }) => {
    const url = cleanText(rawUrl);
    if (!url) return;

    const label = platformLabel(platform, url);
    const key = `${label}::${url}`.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);

    const marker = platformMarker(platform, url);
    links.push({
      key,
      label,
      url,
      href: normalizeLinkHref(url, platform),
      icon: platformIcon(platform, url, iconUrl),
      copyOnly: isCopyOnlyLink(platform, url),
      isPrimarySocial: PRIMARY_SOCIALS.some((item) => marker.includes(item)),
    });
  });

  return links;
};

const getPhone = (profile: PublicCardProfile, whatsapp: boolean) =>
  cleanText(profile.phones?.find((item) =>
    /whatsapp/i.test(cleanText(item.type)) === whatsapp && Boolean(cleanText(item.number)),
  )?.number);

const formatBirthDate = (value: string) => {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
  return match ? `${match[3]}.${match[2]}.${match[1]}` : value;
};

const resolveProfile = (profile: PublicCardProfile) => {
  const firstName = cleanText(profile.firstName);
  const lastName = cleanText(profile.lastName);
  const fullName = [firstName, lastName, cleanText(profile.middleName)].filter(Boolean).join(' ');
  const email = cleanText(profile.email);

  return {
    fullName: fullName || email || 'Əməkdaş',
    roleLabel: cleanText(profile.jobTitle) || 'İşçi',
    companyName: cleanText(profile.companyName),
    avatarSrc: cleanText(profile.photo),
    initials: `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || 'İ',
    backgroundUrl: cleanText(profile.cardBackground) || cleanText(profile.companyLogo),
    dateOfBirth: cleanText(profile.dateOfBirth),
    additionalInfo: cleanText(profile.extras?.find((item) => /əlavə məlumat|haqqında|about/i.test(cleanText(item.label)))?.value),
    phone: getPhone(profile, false),
    whatsapp: getPhone(profile, true),
    email,
    links: toCardLinks(profile),
    googleMapsUrl: cleanText(profile.googleMapsUrl),
    address: cleanText(profile.address),
  };
};

const coverStyle = (backgroundUrl: string) => backgroundUrl
  ? {
      backgroundImage: `linear-gradient(180deg,rgba(255, 255, 255, 0.08),var(--bg-rgba-18-51-74-p18)),url("${backgroundUrl.replace(/"/g, '%22')}")`,
      backgroundSize: 'contain',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      backgroundColor: 'var(--bg-f8fcff)',
    }
  : undefined;

function CardSection({ title, className, children }: { title?: string; className: string; children: ReactNode }) {
  return (
    <section className="ca-admin-card-section employee-preview-section">
      {title && <h3>{title}</h3>}
      <div className={className}>{children}</div>
    </section>
  );
}

function CardActionButton(props: AppButtonProps) {
  return <AppButton appTone="muted" className="ca-white-action-button force-navy-action" {...props} />;
}

export function CommonBusinessCardView({ card }: CommonBusinessCardViewProps) {
  const { profile, actions = {}, settings = {} } = card;
  const view = resolveProfile(profile);
  const { onEdit, onAddContact, addContactLoading = false, onChangeCode, onQrCode } = actions;
  const {
    showEditPermission = false,
    canEdit = false,
    onCanEditChange,
    showStatus = false,
    isActive = true,
    onStatusChange,
  } = settings;

  const contactLink = view.phone ? `tel:${view.phone}` : view.email ? `mailto:${view.email}` : undefined;
  const primarySocials = view.links.filter((link) => link.isPrimarySocial);
  const customLinks = view.links.filter((link) => !link.isPrimarySocial);
  const bottomActionCount = Number(Boolean(onChangeCode)) + Number(Boolean(onQrCode));

  return (
    <article className="common-business-card employee-business-card ca-admin-profile-card">
      <div className="ca-admin-profile-cover employee-business-card-cover" style={coverStyle(view.backgroundUrl)} />

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

        {view.additionalInfo && <div className="ca-admin-profile-bio">{view.additionalInfo}</div>}

        {view.dateOfBirth && (
          <CardSection className="ca-admin-business-links">
            <div className="common-business-card-info-row">
              <span className="ca-admin-business-icon"><CalendarOutlined /></span>
              <strong>Doğum tarixi: {formatBirthDate(view.dateOfBirth)}</strong>
            </div>
          </CardSection>
        )}

        {(onAddContact || contactLink) && (
          <div className="ca-admin-profile-primary-actions employee-preview-primary-actions">
            {onAddContact && (
              <CardActionButton
                icon={addContactLoading ? <LoadingOutlined /> : <ContactsOutlined />}
                disabled={addContactLoading}
                onClick={() => void onAddContact()}
              >
                Kontakta əlavə et
              </CardActionButton>
            )}

            {contactLink && (
              <CardActionButton icon={<PhoneOutlined />} href={contactLink}>
                Əlaqə
              </CardActionButton>
            )}
          </div>
        )}

        {(view.phone || view.email || view.whatsapp) && (
          <CardSection title="Əlaqə" className="ca-admin-contact-grid">
            {view.phone && <a href={`tel:${view.phone}`} aria-label="Zəng et"><PhoneOutlined /></a>}
            {view.email && <a href={`mailto:${view.email}`} aria-label="E-poçt"><MailOutlined /></a>}
            {view.whatsapp && (
              <a href={`https://wa.me/${view.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" aria-label="WhatsApp">
                <WhatsAppOutlined />
              </a>
            )}
          </CardSection>
        )}

        {primarySocials.length > 0 && (
          <CardSection title="Sosial media" className="ca-admin-social-grid">
            {primarySocials.map((link) => (
              <a key={link.key} href={link.href} target="_blank" rel="noreferrer" aria-label={link.label}>
                {link.icon}
              </a>
            ))}
          </CardSection>
        )}

        {customLinks.length > 0 && (
          <CardSection title="Linklər" className="ca-admin-business-links">
            {customLinks.map((link) => (
              <a
                key={link.key}
                href={link.copyOnly ? '#' : link.href}
                target={link.copyOnly ? undefined : '_blank'}
                rel={link.copyOnly ? undefined : 'noreferrer'}
                onClick={link.copyOnly
                  ? (event) => {
                      event.preventDefault();
                      void navigator.clipboard?.writeText(link.url);
                    }
                  : undefined}
              >
                <span className="ca-admin-business-icon employee-custom-preview-icon">{link.icon}</span>
                <strong>{link.label}</strong>
              </a>
            ))}
          </CardSection>
        )}

        {view.googleMapsUrl && (
          <CardSection title="Google Maps" className="ca-admin-business-links">
            <a href={normalizeLinkHref(view.googleMapsUrl, 'Ünvan')} target="_blank" rel="noreferrer">
              <span className="ca-admin-business-icon"><EnvironmentOutlined /></span>
              <strong>{view.address || 'Google Maps ünvanı'}</strong>
            </a>
          </CardSection>
        )}

        {(showEditPermission || showStatus) && (
          <div className="employee-preview-settings">
            {showEditPermission && (
              <div>
                <span>Redaktə icazəsi</span>
                <Switch checked={canEdit} onChange={(checked) => void onCanEditChange?.(checked)} />
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

        {bottomActionCount > 0 && (
          <div className={`employee-preview-actions ${bottomActionCount === 1 ? 'is-single' : ''}`}>
            {onChangeCode && <CardActionButton icon={<KeyOutlined />} onClick={onChangeCode}>Kodu dəyiş</CardActionButton>}
            {onQrCode && <CardActionButton icon={<QrcodeOutlined />} onClick={onQrCode}>QR kod</CardActionButton>}
          </div>
        )}
      </div>
    </article>
  );
}

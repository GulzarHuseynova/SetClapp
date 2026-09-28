import type { ReactNode } from 'react';
import { CalendarOutlined, ContactsOutlined, CreditCardOutlined, EnvironmentOutlined, FacebookOutlined, GlobalOutlined, InstagramOutlined, LinkOutlined, LinkedinOutlined, MailOutlined, MessageOutlined, PhoneOutlined, SendOutlined, TikTokOutlined, WhatsAppOutlined, XOutlined, YoutubeOutlined } from '@ant-design/icons';

// Backend bəzən boş sahələri "string" placeholder-i ilə qaytarır.
export const cleanText = (value?: string | null) => {
  const text = String(value ?? '').trim();
  return text && text.toLowerCase() !== 'string' ? text : '';
};

export const platformMarker = (platformName?: string, profileUrl?: string) =>
  `${cleanText(platformName)} ${cleanText(profileUrl)}`.toLowerCase();

const isXPlatform = (platformName: string | undefined, marker: string) =>
  cleanText(platformName).toLowerCase() === 'x' || marker.includes('twitter') || marker.includes('x.com');

export const isCopyOnlyLink = (platformName?: string, profileUrl?: string) => {
  const marker = platformMarker(platformName, profileUrl);
  return marker.includes('iban') || marker.includes('kart hesab');
};

export const platformIcon = (platformName?: string, profileUrl?: string, iconUrl?: string): ReactNode => {
  if (cleanText(iconUrl)) return <img src={iconUrl} alt="" />;

  const marker = platformMarker(platformName, profileUrl);

  if (marker.includes('linkedin')) return <LinkedinOutlined />;
  if (marker.includes('facebook')) return <FacebookOutlined />;
  if (marker.includes('instagram')) return <InstagramOutlined />;
  if (isXPlatform(platformName, marker)) return <XOutlined />;
  if (marker.includes('youtube')) return <YoutubeOutlined />;
  if (marker.includes('tiktok')) return <TikTokOutlined />;
  if (marker.includes('whatsapp') || marker.includes('wa.me')) return <WhatsAppOutlined />;
  if (marker.includes('telegram') || marker.includes('t.me')) return <SendOutlined />;
  if (isCopyOnlyLink(platformName, profileUrl)) return <CreditCardOutlined />;
  if (marker.includes('görüş') || marker.includes('meeting') || marker.includes('calend')) return <CalendarOutlined />;
  if (marker.includes('ünvan') || marker.includes('address') || marker.includes('map')) return <EnvironmentOutlined />;
  if (marker.includes('mesaj') || marker.includes('message') || marker.includes('sms')) return <MessageOutlined />;
  if (marker.includes('email') || marker.includes('mail') || marker.includes('poçt')) return <MailOutlined />;
  if (marker.includes('telefon') || marker.includes('phone') || marker.includes('tel:')) return <PhoneOutlined />;
  if (marker.includes('contact') || marker.includes('kontakt')) return <ContactsOutlined />;
  if (marker.includes('sayt') || marker.includes('site') || marker.includes('web')) return <GlobalOutlined />;

  return <LinkOutlined />;
};

export const platformLabel = (platformName?: string, profileUrl?: string) => {
  const raw = cleanText(platformName);
  if (raw && !/özəl|custom/i.test(raw)) return raw;

  const marker = platformMarker(platformName, profileUrl);

  if (marker.includes('linkedin')) return 'LinkedIn';
  if (marker.includes('facebook')) return 'Facebook';
  if (marker.includes('instagram')) return 'Instagram';
  if (marker.includes('youtube')) return 'YouTube';
  if (marker.includes('tiktok')) return 'TikTok';
  if (marker.includes('whatsapp') || marker.includes('wa.me')) return 'WhatsApp';
  if (marker.includes('telegram') || marker.includes('t.me')) return 'Telegram';
  if (isXPlatform(platformName, marker)) return 'X';
  if (marker.includes('mailto:')) return 'E-poçt';
  if (marker.includes('tel:')) return 'Telefon';
  if (isCopyOnlyLink(platformName, profileUrl)) return 'Kart hesabı';
  if (marker.includes('map') || marker.includes('ünvan') || marker.includes('address')) return 'Ünvan';

  return raw || 'Link';
};

export const normalizeLinkHref = (value?: string, platformName?: string) => {
  const text = cleanText(value);
  if (!text || /^(https?:\/\/|mailto:|tel:|sms:)/i.test(text)) return text;

  const marker = platformMarker(platformName, value);

  if (marker.includes('telefon') || marker.includes('phone')) return `tel:${text}`;
  if (marker.includes('email') || marker.includes('mail') || marker.includes('poçt')) return `mailto:${text}`;
  if (marker.includes('mesaj') || marker.includes('message') || marker.includes('sms')) return `sms:${text}`;
  if (marker.includes('whatsapp')) return `https://wa.me/${text.replace(/\D/g, '')}`;
  if (marker.includes('telegram') && text.startsWith('@')) return `https://t.me/${text.slice(1)}`;
  if (marker.includes('ünvan') || marker.includes('address')) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(text)}`;
  }

  return `https://${text}`;
};

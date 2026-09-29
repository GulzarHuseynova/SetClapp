import { publicAxiosInstance } from '../../api/client';
import type { PublicCardProfile, ScanSource } from '../../types/public-card.type';
import { getFullName } from './public-card-shared';
import { downloadVCard } from './public-card-vcard';
import { downloadBlob } from '../../utils/download.utils';

const clean = (value?: string) => String(value || '').trim();

export const downloadPublicCardVcf = async (
  profile: PublicCardProfile,
  source: ScanSource = 'Direct',
) => {
  const cardId = clean(profile.id || profile.employeeId);
  if (!cardId) {
    await downloadVCard(profile);
    return;
  }

  try {
    const response = await publicAxiosInstance.get(
      `/api/cards/${encodeURIComponent(cardId)}/vcf`,
      {
        params: { source },
        responseType: 'blob',
        headers: { 'Cache-Control': 'no-cache' },
      },
    );

    const blob = response.data instanceof Blob
      ? response.data
      : new Blob([response.data], { type: 'text/vcard;charset=utf-8' });

    const fileName = `${getFullName(profile).replace(/\s+/g, '-').toLowerCase() || 'contact'}-contact.vcf`;
    downloadBlob(blob, fileName);
  } catch (error) {
    console.warn('GET /api/cards/{id}/vcf uğursuz oldu, lokal VCF istifadə edilir:', error);
    await downloadVCard(profile);
  }
};

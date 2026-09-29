import { Ecc, QrCode } from '@rc-component/qrcode/es/libs/qrcodegen';
import type { PublicCardProfile, QrDownloadFormat } from '../../types/public-card.type';
import { getFullName } from './public-card-shared';
import { buildOfflineQrVCard } from './public-card-vcard';
import { downloadBlob } from '../../utils/download.utils';

const escapeHtml = (value: string) => {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
};

const getSafeQrDownloadFileName = (profile: PublicCardProfile, extension: 'png' | 'svg' | 'pdf') => {
  const baseName = getFullName(profile) || profile.email || profile.id || 'qr';
  const safeName = baseName
    .toLowerCase()
    .replace(/ə/g, 'e')
    .replace(/ö/g, 'o')
    .replace(/ü/g, 'u')
    .replace(/ğ/g, 'g')
    .replace(/ı/g, 'i')
    .replace(/ç/g, 'c')
    .replace(/ş/g, 's')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'qr';

  return `${safeName}-${profile.id.slice(0, 8)}-contact-qr.${extension}`;
};

const getQrModules = (payload: string) => {
  return QrCode.encodeText(payload, Ecc.MEDIUM).getModules();
};

const buildQrSvg = (payload: string, size = 600) => {
  const modules = getQrModules(payload);
  const margin = 4;
  const cellCount = modules.length + margin * 2;
  const rects: string[] = [];

  modules.forEach((row, y) => {
    row.forEach((cell, x) => {
      if (!cell) return;
      rects.push(`<rect x="${x + margin}" y="${y + margin}" width="1" height="1"/>`);
    });
  });

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${cellCount} ${cellCount}" shape-rendering="crispEdges">
  <rect width="100%" height="100%" fill="#fff"/>
  <g fill="#111827">${rects.join('')}</g>
</svg>`;
};

const buildQrPngBlob = async (payload: string, size = 600) => {
  const modules = getQrModules(payload);
  const margin = 4;
  const cellCount = modules.length + margin * 2;
  const scale = size / cellCount;
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');

  if (!context) {
    throw new Error('Canvas QR yaradıla bilmədi.');
  }

  canvas.width = size;
  canvas.height = size;
  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, size, size);
  context.fillStyle = '#111827';

  modules.forEach((row, y) => {
    row.forEach((cell, x) => {
      if (!cell) return;
      context.fillRect(
        Math.round((x + margin) * scale),
        Math.round((y + margin) * scale),
        Math.ceil(scale),
        Math.ceil(scale),
      );
    });
  });

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
        return;
      }

      reject(new Error('PNG QR faylı yaradıla bilmədi.'));
    }, 'image/png');
  });
};

export const getQrPayload = (profile: PublicCardProfile) => buildOfflineQrVCard(profile);

const buildQrDownloadBlob = async (profile: PublicCardProfile, format: 'png' | 'svg') => {
  const payload = getQrPayload(profile);
  const fileName = getSafeQrDownloadFileName(profile, format);

  if (format === 'svg') {
    return {
      blob: new Blob([buildQrSvg(payload)], { type: 'image/svg+xml;charset=utf-8' }),
      fileName,
    };
  }

  return {
    blob: await buildQrPngBlob(payload),
    fileName,
  };
};

const downloadQrImage = async (profile: PublicCardProfile, format: 'png' | 'svg') => {
  const { blob, fileName } = await buildQrDownloadBlob(profile, format);
  downloadBlob(blob, fileName);
};

const openQrPdfPrintPage = (profiles: PublicCardProfile[] | PublicCardProfile) => {
  const rows = Array.isArray(profiles) ? profiles : [profiles];
  const cards = rows.map((profile) => {
    const name = getFullName(profile);
    const qrDescription = 'Şəkilsiz kontakt QR · internetlə və internetsiz işləyir';
    const qrSvg = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(buildQrSvg(getQrPayload(profile), 320))}`;
    return `
      <article class="card">
        ${profile.companyLogo ? `<img class="logo" src="${escapeHtml(profile.companyLogo)}" alt="logo" />` : ''}
        <h2>${escapeHtml(name)}</h2>
        ${profile.jobTitle ? `<p>${escapeHtml(profile.jobTitle)}</p>` : ''}
        ${profile.companyName ? `<strong>${escapeHtml(profile.companyName)}</strong>` : ''}
        <img class="qr" src="${qrSvg}" alt="QR" />
        <small>${escapeHtml(qrDescription)}</small>
      </article>
    `;
  }).join('');

  const page = `<!doctype html>
<html><head><meta charset="utf-8"><title>QR PDF</title>
<style>
body{font-family:Arial,sans-serif;background:#f8fafc;margin:0;padding:24px;color:#0f172a}.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:18px}.card{page-break-inside:avoid;background:#fff;border:1px solid #e2e8f0;border-radius:18px;padding:20px;text-align:center;box-shadow:0 10px 30px rgba(15,23,42,.08)}.logo{max-height:46px;max-width:140px;object-fit:contain;margin-bottom:8px}.qr{width:220px;height:220px;margin:14px auto;display:block}h2{font-size:20px;margin:8px 0 4px}p{margin:0 0 4px;color:#475569}small{word-break:break-all;color:#64748b}@media print{body{background:#fff}.card{box-shadow:none}}
</style></head><body><button onclick="window.print()" style="margin-bottom:16px;padding:10px 14px;border-radius:10px;border:1px solid #c7d2fe;background:#eef2ff;color:#312e81;font-weight:700;cursor:pointer">PDF kimi saxla / çap et</button><div class="grid">${cards}</div></body></html>`;

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    downloadBlob(new Blob([page], { type: 'text/html;charset=utf-8' }), 'qr-print-page.html');
    return;
  }

  printWindow.document.open();
  printWindow.document.write(page);
  printWindow.document.close();
};

export const downloadQrByFormat = async (profile: PublicCardProfile, format: QrDownloadFormat) => {
  if (format === 'pdf') {
    openQrPdfPrintPage(profile);
    return;
  }

  await downloadQrImage(profile, format);
};

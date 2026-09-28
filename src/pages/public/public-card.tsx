import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Empty, Modal, QRCode } from 'antd';
import { useParams, useSearchParams } from 'react-router';
import { CommonBusinessCardView, type BusinessCardViewModel } from '../../components/common-business-card-view';
import {
  downloadPublicCardVcf,
  fetchPublicCardProfile,
  getFullName,
  getQrPayload,
  recordPublicScan,
  type PublicCardProfile,
  type ScanSource,
} from '../../features/public-card/public-card';

export default function PublicCard() {
  const { cardId = '' } = useParams();
  const [searchParams] = useSearchParams();
  const scanRecordedRef = useRef(false);
  const vcfDownloadedRef = useRef(false);
  const [qrOpen, setQrOpen] = useState(false);

  const source = useMemo<ScanSource>(() => {
    const value = (searchParams.get('source') || searchParams.get('type') || '').toUpperCase();
    if (value === 'NFC') return 'NFC';
    if (value === 'QR') return 'QR';
    return 'Direct';
  }, [searchParams]);

  const shouldAutoDownloadVcf = useMemo(
    () => source === 'QR' && searchParams.get('downloadVcf') === '1',
    [searchParams, source],
  );

  const requestKey = `${cardId}:${source}:${shouldAutoDownloadVcf ? 'vcf' : 'page'}`;
  const [cardState, setCardState] = useState<{ key: string; profile: PublicCardProfile | null }>({
    key: '',
    profile: null,
  });

  const loading = cardState.key !== requestKey;
  const profile = loading ? null : cardState.profile;

  useEffect(() => {
    let cancelled = false;
    scanRecordedRef.current = false;
    vcfDownloadedRef.current = false;

    fetchPublicCardProfile(cardId, source).then((data) => {
      if (!cancelled) setCardState({ key: requestKey, profile: data });
    });

    return () => {
      cancelled = true;
    };
  }, [cardId, requestKey, source]);

  useEffect(() => {
    if (!profile || scanRecordedRef.current) return;
    scanRecordedRef.current = true;
    void recordPublicScan(profile, source);
  }, [profile, source]);

  useEffect(() => {
    if (!profile || !shouldAutoDownloadVcf || vcfDownloadedRef.current) return;
    vcfDownloadedRef.current = true;
    const timer = window.setTimeout(() => void downloadPublicCardVcf(profile, source), 250);
    return () => window.clearTimeout(timer);
  }, [profile, shouldAutoDownloadVcf, source]);

  if (loading) {
    return (
      <div className="public-common-card-state">
        <div className="public-common-card-state-box"><Empty description="Vizitkart yüklənir..." /></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="public-common-card-state">
        <div className="public-common-card-state-box">
          <Empty description="Vizitkart tapılmadı" />
          <Alert
            type="info"
            showIcon
            className="mt-4"
            title="Bu link üçün məlumat yoxdur"
            description="CompanyAdmin panelində əməkdaşı əlavə edin və QR kodu yenidən açın."
          />
        </div>
      </div>
    );
  }

  const businessCard: BusinessCardViewModel = {
    profile,
    actions: {
      onAddContact: () => downloadPublicCardVcf(profile, source),
      onQrCode: () => setQrOpen(true),
    },
  };

  return (
    <div className="public-common-card-page">
      <div className="public-common-card-shell">
        <CommonBusinessCardView card={businessCard} />
      </div>

      <Modal
        open={qrOpen}
        onCancel={() => setQrOpen(false)}
        footer={null}
        centered
        width={390}
        className="employee-qr-modal"
        title={null}
      >
        <div className="employee-qr-modal-content">
          <div className="employee-qr-heading">
            <div>
              <strong>{getFullName(profile)} QR kodu</strong>
              <span>Vizitkartı açmaq üçün QR kodu skan edin</span>
            </div>
          </div>
          <div className="employee-qr-code-wrap">
            <QRCode value={getQrPayload(profile)} size={230} bordered={false} errorLevel="M" />
          </div>
        </div>
      </Modal>
    </div>
  );
}

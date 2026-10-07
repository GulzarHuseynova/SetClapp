import { Modal, QRCode } from 'antd';
import type { CardQrModalProps } from '../types/business-card-view.type';

export function CardQrModal({ open, onClose, title, subtitle, qrValue, icon, children }: CardQrModalProps) {
  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      destroyOnHidden
      centered
      width={390}
      className="employee-qr-modal"
      title={null}
    >
      <div className="employee-qr-modal-content">
        <div className="employee-qr-heading">
          {icon}
          <div>
            <strong>{title}</strong>
            <span>{subtitle}</span>
          </div>
        </div>

        <div className="employee-qr-code-wrap">
          <QRCode type="svg" color="#000000e0" bgColor="#ffffff" value={qrValue} size={230} bordered={false} errorLevel="M" />
        </div>

        {children}
      </div>
    </Modal>
  );
}

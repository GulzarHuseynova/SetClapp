import type { ReactNode } from 'react';
import type { EditableProfileValues } from './layout.type';
import type { PublicCardProfile } from './public-card.type';

export interface CardQrModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle: string;
  qrValue: string;
  icon?: ReactNode;
  children?: ReactNode;
}

export interface BusinessCardActions {
  onEdit?: () => void;
  onAddContact?: () => void | Promise<void>;
  addContactLoading?: boolean;
  onChangeCode?: () => void;
  onQrCode?: () => void;
}

export interface BusinessCardSettings {
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

export interface CardLink {
  key: string;
  label: string;
  url: string;
  href: string;
  icon: ReactNode;
  copyOnly: boolean;
  isPrimarySocial: boolean;
}

export interface CompanyAdminProfileViewProps {
  displayName: string;
  companyName?: string;
  companyLogo?: string;
  avatarSrc?: string;
  initials: string;
  profileDetails?: { label: string; value?: string }[];
  initialValues?: EditableProfileValues;
  onSave?: (values: EditableProfileValues) => Promise<void>;
  onUploadPhoto?: (file: File) => Promise<void>;
  onUploadCardBackground?: (file: File) => Promise<string>;
  initialEditing?: boolean;
  onCancelEdit?: () => void;
  successMessage?: string;
}

export type LinkPreset = {
  name: string;
  label: string;
  category: "contact" | "social" | "business";
  icon: ReactNode;
  placeholder: string;
  helper: string;
};

export interface AdminCardProfileInput {
  values?: EditableProfileValues;
  companyName?: string;
  companyLogo?: string;
  avatarSrc?: string;
  email: string;
  voen: string;
}

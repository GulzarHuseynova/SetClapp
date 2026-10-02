import type { Dispatch, SetStateAction } from 'react';
import type { FormInstance } from 'antd';
import type { AddUserFormValues, UserData } from './company-admin.type';
import type { NormalizedCompanyInfo } from './company.type';

export type EmployeeStatusTab = 'active' | 'inactive';
export type ExportLoadingType = 'excel' | 'excelSelected' | 'html' | 'htmlSelected' | null;
export type BusinessCardTableRow = UserData & { __tableRowKey: string };

export interface TablePaginationState {
  current: number;
  pageSize: number;
}

export interface ImportResultState {
  success: number;
  errors: string[];
}

export type EmployeeLinkSnapshot = {
  id: string;
  email?: string;
  linkedin?: string;
  facebook?: string;
  instagram?: string;
  whatsapp?: string;
  googleMapsUrl?: string;
  socialAccounts?: AddUserFormValues['socialAccounts'];
};

export type BirthDateInputProps = {
  id?: string;
  value?: string;
  onChange?: (value: string) => void;
};

export interface AddEmployeeModalProps {
  form: FormInstance<AddUserFormValues>;
  isOpen: boolean;
  submitLoading: boolean;
  photoPreview: string;
  onClose: () => void;
  onSubmit: (values: AddUserFormValues) => void | Promise<void>;
  onPhotoSelect: (file: File) => Promise<boolean>;
}

export interface EditEmployeeModalProps {
  form: FormInstance<Partial<AddUserFormValues>>;
  isOpen: boolean;
  companyUsers: UserData[];
  selectedEditUser?: UserData;
  selectedEditUserId: string;
  editPhotoPreview: string;
  editSubmitLoading: boolean;
  onClose: () => void;
  onSubmit: (values: Partial<AddUserFormValues>) => void | Promise<void>;
  onPhotoSelect: (file: File) => Promise<boolean>;
  onOpenUser: (user: UserData) => void;
  companyName?: string;
}

export interface HtmlExportModalProps {
  isOpen: boolean;
  exportableUsers: UserData[];
  selectedHtmlExportIds: string[];
  exportLoading: ExportLoadingType;
  setSelectedHtmlExportIds: Dispatch<SetStateAction<string[]>>;
  onClose: () => void;
  onExportSelectedHtml: () => void | Promise<void>;
}

export interface ImportEmployeesModalProps {
  isOpen: boolean;
  importFile: File | null;
  importResult: ImportResultState | null;
  importLoading: boolean;
  templateLoading: boolean;
  isLimitReached: boolean;
  currentEmployeesCount: number;
  employeeLimit: number;
  setImportFile: Dispatch<SetStateAction<File | null>>;
  setImportResult: Dispatch<SetStateAction<ImportResultState | null>>;
  onClose: () => void;
  onDownloadTemplate: () => void | Promise<void>;
  onImportSubmit: () => void | Promise<void>;
}

export interface BusinessCardToolbarProps {
  activeUsersCount: number;
  archivedUsersCount: number;
  currentEmployeesCount: number;
  employeeLimit: number;
  isLimitReached: boolean;
  onOpenAdd: () => void;
}

export interface EmployeesTableProps {
  employeeStatusTab: EmployeeStatusTab;
  activeUsersCount: number;
  archivedUsersCount: number;
  tableRows: BusinessCardTableRow[];
  hasMore: boolean;
  onLoadMore: () => void;
  company: NormalizedCompanyInfo;
  companyCardBackground?: string;
  protectedAdminKeys: string[];
  vcfLoadingId: string | null;
  onStatusTabChange: (value: string | number) => void;
  onOpenEditUser: (user: UserData) => void;
  onToggleUserStatus: (id: string, currentStatus: boolean) => void | Promise<void>;
  onToggleUserCanEdit: (id: string, currentCanEdit: boolean) => void | Promise<void>;
  onDownloadVcf: (user: UserData) => void | Promise<void>;
  onViewPublicCard: (user: UserData) => void;
  onCopyPublicCardLink: (user: UserData) => void | Promise<void>;
  onOpenResetPassword: (user: UserData) => void;
}

export interface BusinessCardProps {
  detailOnly?: boolean;
}

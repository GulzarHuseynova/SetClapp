import type { NormalizedUser } from './company.type';

// HTML export faylında işçini tapmaq və "Əlavə məlumat"-dakı təkrarlanan sosial linkləri təmizləmək üçün lazım olan sahələr.
export type HtmlExportEmployee = Pick<
  NormalizedUser,
  | 'id'
  | 'firstName'
  | 'lastName'
  | 'email'
  | 'additionalInfo'
  | 'linkedin'
  | 'facebook'
  | 'instagram'
  | 'socialAccounts'
>;

export type ExportImportLoadingAction = 'all-excel' | 'selected-excel' | 'template' | 'import' | 'all-html' | 'selected-html' | null;

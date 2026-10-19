import type { NormalizedUser } from './company.type';


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

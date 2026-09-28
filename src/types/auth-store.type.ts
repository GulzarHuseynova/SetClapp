import type { NormalizedRole } from './common.type';

export type UserRole = NormalizedRole;

export interface AuthState {
  isAuthenticated: boolean;
  accessToken: string;
  refreshToken: string;
  role: UserRole;
  companyId: string;
  companyVoen: string;
  userId: string;
  accountInfo: Record<string, unknown> | null;
}

export type AuthAction =
  | { type: 'SET_SESSION'; payload: Partial<AuthState> }
  | { type: 'SET_ACCOUNT_INFO'; payload: Record<string, unknown> | null }
  | { type: 'LOGOUT' };

export interface StoredUserSession {
  companyId?: string;
  email?: string;
  firstName?: string;
  fullName?: string;
  id?: string;
  isFirstLogin?: boolean;
  lastName?: string;
  role?: string;
  companyVoen?: string;
  userId?: string;
  accountInfo?: Record<string, unknown> | null;
  refreshToken?: string;
  mustChangePassword?: boolean;
  firstLogin?: boolean;
  forcePasswordChange?: boolean;
}

export interface StoredAuthMeta {
  companyVoen?: string;
  user?: StoredUserSession | null;
}

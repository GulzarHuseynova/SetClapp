import { useSyncExternalStore } from 'react';
import { authReducer, getInitialAuthState, normalizeRole } from './authSlice';
import type { AuthAction, AuthState } from '../types/auth-store.type';

export type { AuthAction, AuthState, UserRole } from '../types/auth-store.type';

// İlkin vəziyyət modul import olunanda yox, ilk istifadədə oxunur: main.tsx əvvəlcə
// IndexedDB-dəki davamlı məlumatları (rol daxil) bərpa edir, sonra tətbiqi render edir.
let state: AuthState | null = null;
const listeners = new Set<() => void>();

const getState = (): AuthState => {
  state ??= getInitialAuthState();
  return state;
};

export const authStore = {
  getState,

  subscribe: (listener: () => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  dispatch: (action: AuthAction) => {
    state = authReducer(getState(), action);
    listeners.forEach((listener) => listener());
  },
};

export const authActions = {
  setSession: (payload: Partial<AuthState>) => authStore.dispatch({ type: 'SET_SESSION', payload }),
  setAccountInfo: (payload: Record<string, unknown> | null) => authStore.dispatch({ type: 'SET_ACCOUNT_INFO', payload }),
  logout: () => authStore.dispatch({ type: 'LOGOUT' }),
};

export function useAuthSelector<T>(selector: (state: AuthState) => T): T {
  return useSyncExternalStore(
    authStore.subscribe,
    () => selector(authStore.getState()),
    () => selector(authStore.getState()),
  );
}

export { normalizeRole };

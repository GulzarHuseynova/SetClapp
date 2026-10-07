import { useSyncExternalStore } from 'react';

export type ThemeMode = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

export const THEME_STORAGE_KEY = 'setclapp-theme';

const DARK_QUERY = '(prefers-color-scheme: dark)';
const MODES: readonly ThemeMode[] = ['light', 'dark', 'system'];

const isThemeMode = (value: unknown): value is ThemeMode => MODES.includes(value as ThemeMode);

const readStoredMode = (): ThemeMode => {
  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    return isThemeMode(stored) ? stored : 'system';
  } catch {
    return 'system';
  }
};

const systemPrefersDark = () =>
  typeof window.matchMedia === 'function' && window.matchMedia(DARK_QUERY).matches;

export const resolveTheme = (mode: ThemeMode, prefersDark: boolean): ResolvedTheme =>
  mode === 'system' ? (prefersDark ? 'dark' : 'light') : mode;

let mode: ThemeMode = readStoredMode();
const listeners = new Set<() => void>();

const applyTheme = () => {
  const resolved = resolveTheme(mode, systemPrefersDark());
  const root = document.documentElement;
  root.dataset.theme = resolved;
  root.style.colorScheme = resolved;
};

const emit = () => {
  applyTheme();
  listeners.forEach((listener) => listener());
};

const persistMode = () => {
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, mode);
  } catch {
    /* saxlamaq mümkün deyil — seçim yalnız bu sessiyada qalır */
  }
};

let mediaBound = false;
const bindSystemListener = () => {
  if (mediaBound || typeof window.matchMedia !== 'function') return;
  mediaBound = true;
  window.matchMedia(DARK_QUERY).addEventListener('change', () => {
    if (mode === 'system') emit();
  });
};

export const themeStore = {
  getMode: () => mode,
  getResolved: (): ResolvedTheme => resolveTheme(mode, systemPrefersDark()),
  setMode(next: ThemeMode) {
    if (!isThemeMode(next) || next === mode) return;
    mode = next;
    persistMode();
    emit();
  },
  init() {
    mode = readStoredMode();
    persistMode();
    bindSystemListener();
    applyTheme();
  },
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};

export const useThemeMode = () => useSyncExternalStore(themeStore.subscribe, themeStore.getMode);

export const useResolvedTheme = (): ResolvedTheme => {
  useSyncExternalStore(themeStore.subscribe, themeStore.getMode);
  return themeStore.getResolved();
};

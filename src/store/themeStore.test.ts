// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';
import { resolveTheme, themeStore, THEME_STORAGE_KEY } from './themeStore';

describe('themeStore', () => {
  beforeEach(() => {
    window.localStorage.clear();
    themeStore.setMode('system');
    themeStore.init();
  });

  it('resolves system mode from the OS preference', () => {
    expect(resolveTheme('system', true)).toBe('dark');
    expect(resolveTheme('system', false)).toBe('light');
    expect(resolveTheme('dark', false)).toBe('dark');
    expect(resolveTheme('light', true)).toBe('light');
  });

  it('applies and persists the chosen mode', () => {
    themeStore.setMode('dark');
    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');
    themeStore.setMode('light');
    expect(document.documentElement.dataset.theme).toBe('light');
  });

  it('notifies subscribers and ignores invalid values', () => {
    let calls = 0;
    const off = themeStore.subscribe(() => { calls += 1; });
    themeStore.setMode('dark');
    themeStore.setMode('dark');
    themeStore.setMode('bogus' as never);
    off();
    expect(calls).toBe(1);
    expect(themeStore.getMode()).toBe('dark');
  });

  it('falls back to system for a corrupt stored value', () => {
    window.localStorage.setItem(THEME_STORAGE_KEY, 'neon');
    themeStore.init();
    expect(themeStore.getMode()).toBe('system');
  });
});

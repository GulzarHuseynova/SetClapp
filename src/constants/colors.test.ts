// @vitest-environment node
/// <reference types="node" />
// TS paleti (antd tokenləri: constants/colors.ts) ilə CSS paleti (styles/tokens.css) bir-birindən ayrılmasın.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const read = (path: string) => readFileSync(new URL(path, import.meta.url), 'utf8');

describe('dark palette', () => {
  const css = read('../styles/tokens.css');
  const ts = read('./colors.ts');
  const names: Record<string, string> = { bg: '--dark-bg', surface: '--dark-surface', elevated: '--dark-elevated', border: '--dark-border', borderSoft: '--dark-border-soft', text: '--dark-text', primary: '--dark-primary' };

  it.each(Object.entries(names))('%s matches %s in tokens.css', (key, variable) => {
    const tsValue = new RegExp(`${key}: '(#[0-9a-fA-F]{6})'`).exec(ts)?.[1];
    const cssValue = new RegExp(`${variable}: *(#[0-9a-fA-F]{6})`).exec(css)?.[1];
    expect(tsValue).toBeTruthy();
    expect(cssValue?.toLowerCase()).toBe(tsValue!.toLowerCase());
  });
});

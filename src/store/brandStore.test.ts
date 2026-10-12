// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';
import { runtimeStorage } from '../storage/runtime.storage';
import { DEFAULT_BRAND_COLOR } from '../constants/colors';
import { BRAND_COLOR_STORAGE_PREFIX, brandStore } from './brandStore';

describe('brandStore', () => {
  beforeEach(() => {
    brandStore.setActiveCompany('', 'auth');
    brandStore.setActiveCompany('', 'public');
    runtimeStorage.removeItem(`${BRAND_COLOR_STORAGE_PREFIX}c1`);
    runtimeStorage.removeItem(`${BRAND_COLOR_STORAGE_PREFIX}c2`);
  });

  it('saves the color per company and restores it', () => {
    brandStore.setActiveCompany('c1', 'auth');
    brandStore.setColor('#15803D');
    expect(brandStore.getColor()).toBe('#15803d');
    expect(runtimeStorage.getItem(`${BRAND_COLOR_STORAGE_PREFIX}c1`)).toBe('#15803d');

    brandStore.setActiveCompany('c2', 'auth');
    expect(brandStore.getColor()).toBe(DEFAULT_BRAND_COLOR);

    brandStore.setActiveCompany('c1', 'auth');
    expect(brandStore.getColor()).toBe('#15803d');
  });

  it('resets to the default color and forgets the saved value', () => {
    brandStore.setActiveCompany('c1', 'auth');
    brandStore.setColor('#b91c1c');
    brandStore.setColor(null);
    expect(brandStore.getColor()).toBe(DEFAULT_BRAND_COLOR);
    expect(runtimeStorage.getItem(`${BRAND_COLOR_STORAGE_PREFIX}c1`)).toBeNull();
  });

  it('ignores invalid colors', () => {
    brandStore.setActiveCompany('c1', 'auth');
    brandStore.setColor('not-a-color');
    expect(brandStore.getColor()).toBe(DEFAULT_BRAND_COLOR);
  });

  it('only the source that activated a company can clear it', () => {
    brandStore.setActiveCompany('c1', 'public');
    brandStore.setColor('#15803d');
    brandStore.setActiveCompany('', 'auth');
    expect(brandStore.getColor()).toBe('#15803d');
    brandStore.setActiveCompany('', 'public');
    expect(brandStore.getColor()).toBe(DEFAULT_BRAND_COLOR);
  });
});

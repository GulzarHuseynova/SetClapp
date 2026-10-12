import { useSyncExternalStore } from 'react';
import { runtimeStorage } from '../storage/runtime.storage';
import { DEFAULT_BRAND_COLOR } from '../constants/colors';
import { normalizeHex, recolor } from '../utils/brand-color';

export const BRAND_COLOR_STORAGE_PREFIX = 'companyBrandColor:';

type BrandSource = 'auth' | 'public';

const STYLE_ELEMENT_ID = 'setclapp-brand-colors';
const COLOR_VARIABLE = /^--(bg|fg|bd|pro|ca|login|brand|color)-/;
const HEX_VALUE = /^#[0-9a-f]{6}$/i;
const DARK_SELECTOR = /data-theme\s*=\s*['"]?dark/;

let activeCompanyId: string | null = null;
let activeSource: BrandSource | null = null;
let color: string = DEFAULT_BRAND_COLOR;
const listeners = new Set<() => void>();

const storageKey = (companyId: string) => `${BRAND_COLOR_STORAGE_PREFIX}${companyId}`;

const readStoredColor = (companyId: string) => normalizeHex(runtimeStorage.getItem(storageKey(companyId))) ?? DEFAULT_BRAND_COLOR;

interface BrandRule {
  selector: string;
  mode: 'light' | 'dark';
  declarations: Array<[string, string]>;
}

// Stil cədvəllərindən brend ailəsinə aid rəng dəyişənləri bir dəfə toplanır. Beləcə yeni əlavə olunan
// --bg-*/--fg-*/--bd-* dəyişənləri üçün ayrıca siyahı yazmaq lazım olmur.
let cachedRules: BrandRule[] | null = null;

const collectRules = (rules: CSSRuleList, out: BrandRule[]) => {
  for (const rule of Array.from(rules)) {
    if ('cssRules' in rule && !(rule instanceof CSSStyleRule)) {
      collectRules((rule as CSSGroupingRule).cssRules, out);
      continue;
    }
    if (!(rule instanceof CSSStyleRule) || rule.selectorText.includes(',')) continue;

    const declarations: Array<[string, string]> = [];
    for (let index = 0; index < rule.style.length; index += 1) {
      const name = rule.style[index];
      if (!COLOR_VARIABLE.test(name)) continue;
      const value = rule.style.getPropertyValue(name).trim();
      if (HEX_VALUE.test(value)) declarations.push([name, value]);
    }
    if (declarations.length) {
      out.push({ selector: rule.selectorText, mode: DARK_SELECTOR.test(rule.selectorText) ? 'dark' : 'light', declarations });
    }
  }
};

const getBrandRules = (): BrandRule[] => {
  if (cachedRules) return cachedRules;
  const out: BrandRule[] = [];
  for (const sheet of Array.from(document.styleSheets)) {
    try {
      if (sheet.ownerNode instanceof HTMLElement && sheet.ownerNode.id === STYLE_ELEMENT_ID) continue;
      collectRules(sheet.cssRules, out);
    } catch {
      /* başqa mənbədən gələn (məs. şrift) stil cədvəli oxunmur */
    }
  }
  // Boş nəticə cache olunmur: stil cədvəlləri hələ yüklənməyibsə sonrakı çağırışda yenidən cəhd edilir.
  if (out.length) cachedRules = out;
  return out;
};

const applyBrand = () => {
  if (typeof document === 'undefined') return;
  let element = document.getElementById(STYLE_ELEMENT_ID);

  if (color === DEFAULT_BRAND_COLOR) {
    element?.remove();
    return;
  }

  const css = getBrandRules()
    .map(({ selector, mode, declarations }) => {
      const body = declarations
        .map(([name, value]) => [name, value, recolor(value, color, mode)] as const)
        .filter(([, original, next]) => next !== original)
        .map(([name, , next]) => `${name}:${next}`)
        .join(';');
      return body ? `${selector}{${body}}` : '';
    })
    .filter(Boolean)
    .join('\n');

  if (!element) {
    element = document.createElement('style');
    element.id = STYLE_ELEMENT_ID;
    document.head.appendChild(element);
  }
  element.textContent = css;
};

const emit = () => {
  applyBrand();
  listeners.forEach((listener) => listener());
};

export const brandStore = {
  getColor: () => color,

  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  /** Şirkətin saxlanmış rəngini aktiv edir. `source` yalnız öz təyin etdiyi rəngi sıfırlaya bilir. */
  setActiveCompany(companyId: string | null | undefined, source: BrandSource) {
    const id = String(companyId || '').trim();
    if (!id) {
      if (activeSource !== source) return;
      activeCompanyId = null;
      activeSource = null;
      if (color !== DEFAULT_BRAND_COLOR) {
        color = DEFAULT_BRAND_COLOR;
        emit();
      }
      return;
    }

    activeCompanyId = id;
    activeSource = source;
    const next = readStoredColor(id);
    if (next !== color) {
      color = next;
      emit();
    }
  },

  /** Aktiv şirkət üçün rəngi saxlayır; `null` standart rəngə qaytarır. */
  setColor(next: string | null) {
    const normalized = next ? normalizeHex(next) : null;
    if (next && !normalized) return;
    const value = normalized ?? DEFAULT_BRAND_COLOR;

    if (activeCompanyId) {
      if (value === DEFAULT_BRAND_COLOR) runtimeStorage.removeItem(storageKey(activeCompanyId));
      else runtimeStorage.setItem(storageKey(activeCompanyId), value);
    }
    if (value === color) return;
    color = value;
    emit();
  },
};

export const useBrandColor = () => useSyncExternalStore(brandStore.subscribe, brandStore.getColor);

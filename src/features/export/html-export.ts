import type { HtmlExportEmployee } from '../../types/export-import.type';
import { stripSocialLinksFromAdditionalInfo } from '../profile/profile-info';

// Azərbaycan hərflərini və aksentləri atıb mətni müqayisə üçün hazırlayır.
const normalizeComparableText = (value: unknown) =>
  String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('az')
    .replace(/[ə]/g, 'e')
    .replace(/[ı]/g, 'i')
    .replace(/[ş]/g, 's')
    .replace(/[ç]/g, 'c')
    .replace(/[ö]/g, 'o')
    .replace(/[ü]/g, 'u')
    .replace(/[ğ]/g, 'g')
    .replace(/\s+/g, ' ')
    .trim();

const findEmployeeNameElement = (document: Document, employee: HtmlExportEmployee) => {
  const fullName = normalizeComparableText(`${employee.firstName || ''} ${employee.lastName || ''}`);
  const reversedName = normalizeComparableText(`${employee.lastName || ''} ${employee.firstName || ''}`);
  const email = normalizeComparableText(employee.email);
  const textElements = Array.from(document.querySelectorAll(
    'h1, h2, h3, h4, h5, [class*="name" i], [id*="name" i], strong, b, p, span, div',
  ));

  return textElements.find((element) => {
    if (element.children.length > 4) return false;
    const text = normalizeComparableText(element.textContent);
    return Boolean(
      (fullName && (text === fullName || text.includes(fullName))) ||
      (reversedName && (text === reversedName || text.includes(reversedName))) ||
      (email && text === email)
    );
  }) || null;
};

const findEmployeeRoot = (document: Document, employee: HtmlExportEmployee) => {
  const nameElement = findEmployeeNameElement(document, employee);
  if (!nameElement) return null;

  const preferred = nameElement.closest(
    '[data-user-id], [data-employee-id], [class*="business-card" i], [class*="public-card" i], [class*="profile-card" i], [class*="employee-card" i], [class~="card" i], article',
  );
  if (preferred) return preferred;

  return nameElement.closest('main, section') || nameElement.parentElement;
};

const removeOfflineBlockingPolicies = (document: Document) => {
  document.querySelectorAll('meta[http-equiv]').forEach((meta) => {
    const httpEquiv = String(meta.getAttribute('http-equiv') || '').toLowerCase();
    if (httpEquiv === 'content-security-policy') meta.remove();
  });
};

const additionalInfoHeadingValues = new Set([
  'elave melumat',
  'additional info',
  'additional information',
]);

const isAdditionalInfoHeading = (value: unknown) => (
  additionalInfoHeadingValues.has(normalizeComparableText(value))
);

const getAdditionalInfoHeadings = (root: Element) => {
  const walker = root.ownerDocument.createTreeWalker(root, 4);
  const headings = new Set<Element>();
  let node = walker.nextNode();

  while (node) {
    if (isAdditionalInfoHeading(node.textContent)) {
      const parent = (node as Text).parentElement;
      if (parent) headings.add(parent);
    }
    node = walker.nextNode();
  }

  return Array.from(headings);
};

const getAdditionalInfoContainer = (heading: Element, root: Element) => {
  let current = heading.parentElement;
  let candidate: Element | null = heading.parentElement;

  for (let depth = 0; current && current !== root.parentElement && depth < 7; depth += 1) {
    const marker = `${current.id} ${current.className || ''}`.toLowerCase();
    const textWithoutHeading = normalizeComparableText(current.textContent)
      .replace(normalizeComparableText(heading.textContent), '')
      .trim();

    if (/(additional|extra|info|detail|melumat)/i.test(marker)) return current;
    if (textWithoutHeading || current.children.length > 1) candidate = current;
    if (current === root) break;

    current = current.parentElement;
  }

  return candidate;
};

const cleanAdditionalInfoSection = (
  heading: Element,
  root: Element,
  expectedValue?: string,
) => {
  const container = getAdditionalInfoContainer(heading, root);
  if (!container) return;

  if (expectedValue !== undefined && !expectedValue) {
    container.remove();
    return;
  }

  const textNodes: Text[] = [];
  const walker = container.ownerDocument.createTreeWalker(container, 4);
  let node = walker.nextNode();

  while (node) {
    const textNode = node as Text;
    if (!heading.contains(textNode)) textNodes.push(textNode);
    node = walker.nextNode();
  }

  textNodes.forEach((textNode) => {
    textNode.textContent = stripSocialLinksFromAdditionalInfo(textNode.textContent);
  });

  Array.from(container.querySelectorAll('*')).reverse().forEach((element) => {
    if (element === heading || element.contains(heading)) return;
    if (!normalizeComparableText(element.textContent) && element.children.length === 0) element.remove();
  });

  const remainingText = normalizeComparableText(container.textContent)
    .replace(normalizeComparableText(heading.textContent), '')
    .replace(/^[;,:|\-\s]+|[;,:|\-\s]+$/g, '')
    .trim();

  if (expectedValue !== undefined) {
    const cleanedExpected = stripSocialLinksFromAdditionalInfo(expectedValue);

    if (!cleanedExpected) {
      container.remove();
      return;
    }

    const contentElement = Array.from(container.querySelectorAll('p,div,span,strong,b'))
      .find((element) => (
        element !== heading &&
        !element.contains(heading) &&
        element.children.length === 0
      ));

    if (contentElement) {
      contentElement.textContent = cleanedExpected;
    } else {
      const content = container.ownerDocument.createElement('div');
      content.textContent = cleanedExpected;
      container.appendChild(content);
    }
    return;
  }

  if (!remainingText) container.remove();
};

const removeDuplicateSocialAdditionalInfo = (
  document: Document,
  employees: HtmlExportEmployee[],
) => {
  const matchedHeadings = new Set<Element>();

  employees.forEach((employee) => {
    const root = findEmployeeRoot(document, employee);
    if (!root) return;

    const hasAdditionalInfo = Object.prototype.hasOwnProperty.call(employee, 'additionalInfo');
    const expectedValue = hasAdditionalInfo
      ? stripSocialLinksFromAdditionalInfo(
          employee.additionalInfo,
          [
            employee.linkedin,
            employee.facebook,
            employee.instagram,
            ...(employee.socialAccounts || []).map((social) => social.profileUrl),
          ],
        )
      : undefined;

    getAdditionalInfoHeadings(root).forEach((heading) => {
      matchedHeadings.add(heading);
      cleanAdditionalInfoSection(heading, root, expectedValue);
    });
  });

  getAdditionalInfoHeadings(document.body).forEach((heading) => {
    if (matchedHeadings.has(heading) || !heading.isConnected) return;
    cleanAdditionalInfoSection(heading, document.body);
  });
};

const sanitizeStandaloneHtmlFrames = (document: Document) => {
  Array.from(document.querySelectorAll('iframe')).forEach((frame) => {
    const source = String(frame.getAttribute('src') || '').trim();

    // Boş iframe src="" standalone file:// HTML-də cari faylı yenidən açmağa
    // çalışır və Chrome "Unsafe attempt to load URL file:///..." xətası yazır.
    if (!source || source === '#' || source === '.' || source === './') {
      frame.setAttribute('src', 'about:blank');
    }

    const sandboxTokens = String(frame.getAttribute('sandbox') || '')
      .split(/\s+/)
      .filter(Boolean);
    if (sandboxTokens.includes('allow-scripts') && sandboxTokens.includes('allow-same-origin')) {
      frame.setAttribute('sandbox', sandboxTokens.filter((token) => token !== 'allow-same-origin').join(' '));
    }
  });
};

// "Əlavə məlumat"-dakı sosial linklər export zamanı statik təmizlənir
// (removeDuplicateSocialAdditionalInfo). Bu runtime yalnız səhifənin öz JS-i sonradan
// əlavə edə biləcəyi iframe-ləri təhlükəsizləşdirir; mətnə toxunmur.
const appendStandaloneHtmlCleanupRuntime = (document: Document) => {
  const script = document.createElement('script');
  script.setAttribute('data-setclapp-export-cleanup', 'true');
  script.textContent = `(() => {
    const sanitizeFrames = () => document.querySelectorAll('iframe').forEach((frame) => {
      const source = String(frame.getAttribute('src') || '').trim();
      if (!source || source === '#' || source === '.' || source === './') frame.setAttribute('src', 'about:blank');
      const sandboxTokens = String(frame.getAttribute('sandbox') || '').split(/\\s+/).filter(Boolean);
      if (sandboxTokens.includes('allow-scripts') && sandboxTokens.includes('allow-same-origin')) {
        frame.setAttribute('sandbox', sandboxTokens.filter((token) => token !== 'allow-same-origin').join(' '));
      }
    });
    let cleanupTimer = 0;
    const run = () => {
      window.clearTimeout(cleanupTimer);
      cleanupTimer = window.setTimeout(sanitizeFrames, 0);
    };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run, { once: true });
    else run();
    window.setTimeout(run, 100);
    window.setTimeout(run, 500);
    const observer = new MutationObserver(run);
    observer.observe(document.documentElement, { childList: true, subtree: true, characterData: true });
    window.setTimeout(() => observer.disconnect(), 2500);
  })();`;
  document.body.appendChild(script);
};

// Backend şablonu işçi şəklini və kart fonunu özü yazır (ZIP ixracı ilə eyni). Burada yalnız
// oflayn açılışa mane olan siyasətlər, təkrarlanan sosial linklər və təhlükəli iframe-lər təmizlənir.
export const patchExportedHtml = async (blob: Blob, employees: HtmlExportEmployee[]) => {
  if (typeof DOMParser === 'undefined') return blob;

  const html = await blob.text();
  if (!/<html[\s>]/i.test(html)) return blob;

  const document = new DOMParser().parseFromString(html, 'text/html');
  removeOfflineBlockingPolicies(document);
  removeDuplicateSocialAdditionalInfo(document, employees);
  sanitizeStandaloneHtmlFrames(document);
  appendStandaloneHtmlCleanupRuntime(document);

  const output = `<!doctype html>
${document.documentElement.outerHTML}`;
  return new Blob([output], { type: 'text/html;charset=utf-8' });
};

// @vitest-environment jsdom
import { JSDOM } from 'jsdom';
import { describe, expect, it } from 'vitest';
import { patchExportedHtml } from './html-export';
import type { HtmlExportEmployee } from '../../types/export-import.type';

const EXPORTED_CARD = `<!doctype html><html><head></head><body>
<div class="employee-card" data-user-id="1">
  <h2 class="name">Aysel Mammadova</h2>
  <p class="job">Facebook reklamlari uzre mutexessis</p>
  <div class="socials"><a href="https://linkedin.com/in/aysel">LinkedIn</a> <a href="https://instagram.com/aysel">Instagram</a></div>
  <div class="additional-info"><h3>Əlavə məlumat</h3><p>Baki ofisi; linkedin.com/in/aysel</p></div>
  <p class="mail">E-poct: info@max.com</p>
</div>
<script>
  setTimeout(() => {
    const frame = document.createElement('iframe');
    frame.setAttribute('sandbox', 'allow-scripts allow-same-origin');
    document.body.appendChild(frame);
  }, 50);
</script>
</body></html>`;

// Export faylını istifadəçinin brauzerdə açdığı kimi (script-lər işləyir) açır.
const openExportedFile = async () => {
  const patched = await (await patchExportedHtml(new Blob([EXPORTED_CARD], { type: 'text/html' }), [])).text();
  const dom = new JSDOM(patched, { runScripts: 'dangerously', pretendToBeVisual: true });
  await new Promise((resolve) => setTimeout(resolve, 700));
  return dom;
};

// Backend şablonunun quruluşu: ad və cover şəkli səhifə açılanda JS ilə doldurulur. Şablonun qaydası:
// işçinin şəxsi fonu, o yoxdursa şirkət loqosu; ikisi də yoxdursa şəkil gizli qalır və pattern göstərilir.
const LOGO = 'data:image/png;base64,TE9HTw==';
const BACKGROUND = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

const backendTemplate = (logoDelayMs: number | null) => `<!doctype html><html><head><style>.hidden{display:none}</style></head><body>
<article class="card">
  <section class="card-cover">
    <span class="cover-pattern" id="coverPattern" aria-hidden="true"></span>
    <img class="card-cover-media hidden" id="cardCoverMedia" alt="" />
  </section>
  <section class="card-profile">
    <div class="avatar-wrap"><div class="avatar-circle" id="avatar"></div></div>
    <h1 class="card-name" id="cardName"></h1>
  </section>
</article>
<script>
  document.getElementById('cardName').textContent = 'Demir Demirov';
  document.getElementById('avatar').textContent = 'D';
  var showLogo = function () {
    var cover = document.getElementById('cardCoverMedia');
    cover.src = '${LOGO}';
    cover.classList.remove('hidden');
    document.getElementById('coverPattern').classList.add('hidden');
  };
  var logoDelay = ${JSON.stringify(logoDelayMs)};
  if (logoDelay === 0) showLogo();
  else if (logoDelay !== null) setTimeout(showLogo, logoDelay);
</script>
</body></html>`;

// cardBackgroundUrl artıq HtmlExportEmployee tipində yoxdur: test brauzerdə fonu olan işçinin də toxunulmadığını yoxlayır.
const EMPLOYEE_WITH_BACKGROUND = { firstName: 'Demir', lastName: 'Demirov', cardBackgroundUrl: BACKGROUND } as unknown as HtmlExportEmployee;

// logoDelayMs: 0 = loqo dərhal göstərilir, null = şablonda loqo yoxdur, >0 = loqo gec yüklənir.
const openBackendTemplate = async (logoDelayMs: number | null, employees: HtmlExportEmployee[]) => {
  const blob = new Blob([backendTemplate(logoDelayMs)], { type: 'text/html' });
  const patched = await (await patchExportedHtml(blob, employees)).text();
  const dom = new JSDOM(patched, { runScripts: 'dangerously', pretendToBeVisual: true });
  await new Promise((resolve) => setTimeout(resolve, 1100));
  return dom;
};

const readCover = (doc: Document) => ({
  background: doc.querySelector<HTMLElement>('.card-cover')?.style.backgroundImage ?? '',
  logoSrc: doc.querySelector<HTMLImageElement>('#cardCoverMedia')?.getAttribute('src') ?? '',
  logoHidden: (() => {
    const logo = doc.querySelector<HTMLElement>('#cardCoverMedia');
    return !logo || logo.classList.contains('hidden') || logo.style.display === 'none';
  })(),
  patternDisplay: doc.querySelector<HTMLElement>('#coverPattern')?.style.display ?? '',
});

describe('exported card images', () => {
  // Backend şablonu şəkil və fonu özü yazır (ZIP ilə eyni); frontend onlara toxunmamalıdır.
  it('leaves the template cover and logo exactly as the backend produced them', async () => {
    const dom = await openBackendTemplate(0, [EMPLOYEE_WITH_BACKGROUND]);
    const cover = readCover(dom.window.document);

    expect(cover.logoSrc).toBe(LOGO);
    expect(cover.logoHidden).toBe(false);
    expect(cover.background).toBe('');
    expect(cover.patternDisplay).not.toBe('none');

    dom.window.close();
  }, 10000);

  it('does not add a background or photo of its own, even when the employee has one in the browser', async () => {
    const dom = await openBackendTemplate(null, [EMPLOYEE_WITH_BACKGROUND]);
    const doc = dom.window.document;
    const cover = readCover(doc);

    expect(cover.background).toBe('');
    expect(cover.logoHidden).toBe(true);
    expect(doc.querySelector('[data-setclapp-card-background]')).toBeNull();
    expect(doc.querySelector('img[data-setclapp-exported-photo]')).toBeNull();
    expect(doc.querySelector('script[data-setclapp-export-assets]')).toBeNull();

    dom.window.close();
  }, 10000);
});

describe('patchExportedHtml runtime', () => {
  it('keeps the card content intact when the exported file is opened', async () => {
    const dom = await openExportedFile();
    const doc = dom.window.document;

    expect(doc.querySelector('.job')?.textContent).toBe('Facebook reklamlari uzre mutexessis');
    expect(doc.querySelector('.socials')?.textContent?.trim()).toBe('LinkedIn Instagram');
    expect(doc.querySelector('.mail')?.textContent).toBe('E-poct: info@max.com');

    const additional = doc.querySelector('.additional-info')?.textContent ?? '';
    expect(additional).toContain('Baki ofisi');
    expect(additional).not.toContain('linkedin.com');

    dom.window.close();
  }, 10000);

  it('still hardens iframes added later by the page', async () => {
    const dom = await openExportedFile();
    const frame = dom.window.document.querySelector('iframe');

    expect(frame?.getAttribute('src')).toBe('about:blank');
    expect(frame?.getAttribute('sandbox')).toBe('allow-scripts');

    dom.window.close();
  }, 10000);
});

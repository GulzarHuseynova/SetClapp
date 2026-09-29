// @vitest-environment jsdom
import { JSDOM } from 'jsdom';
import { describe, expect, it } from 'vitest';
import { patchExportedHtml } from './html-export';

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

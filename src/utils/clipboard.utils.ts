// navigator.clipboard yalnız HTTPS və ya localhost-da mövcuddur; adi http:// saytda
// köhnə execCommand üsulu ehtiyat kimi işləyir.
const copyWithTextarea = (text: string) => {
  const textarea = document.createElement('textarea');
  textarea.value = text;
  // iOS Safari readonly sahədə seçimi kopyalamır; klaviatura açılmasın deyə inputmode söndürülür.
  textarea.setAttribute('inputmode', 'none');
  textarea.setAttribute('aria-hidden', 'true');
  textarea.style.position = 'fixed';
  textarea.style.top = '0';
  textarea.style.left = '0';
  textarea.style.opacity = '0';
  // 16px-dən kiçik şrift iOS-da səhifəni böyüdür.
  textarea.style.fontSize = '16px';
  document.body.appendChild(textarea);

  const previousFocus = document.activeElement as HTMLElement | null;
  textarea.focus({ preventScroll: true });
  textarea.select();
  // iOS-da select() mətni seçmir, setSelectionRange lazımdır.
  textarea.setSelectionRange(0, text.length);

  try {
    return document.execCommand('copy');
  } catch {
    return false;
  } finally {
    textarea.remove();
    previousFocus?.focus?.({ preventScroll: true });
  }
};

export const copyText = async (text: string): Promise<boolean> => {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // İcazə verilmədikdə və ya səhifə fokusda olmadıqda ehtiyat üsula keçilir.
    }
  }

  return copyWithTextarea(text);
};

export const isEmailLike = (value: string) => /@/.test(value);

// crypto.randomUUID olmayan köhnə brauzerlər üçün ehtiyat variant saxlanılır.
const randomSeed = () => crypto.randomUUID?.() ??
  'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
    const random = (Math.random() * 16) | 0;
    return (char === 'x' ? random : (random & 0x3) | 0x8).toString(16);
  });

// Eyni seed üçün həmişə eyni UUID formatlı QR identifikatoru qaytarır.
export const stableQrUid = (seed: string) => {
  const source = seed || randomSeed();
  let hash = 0x811c9dc5;

  for (let index = 0; index < source.length; index += 1) {
    hash ^= source.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }

  const hex = (hash.toString(16).padStart(8, '0') + source.split('').map((char) => char.charCodeAt(0).toString(16).padStart(2, '0')).join(''))
    .replace(/[^a-f0-9]/gi, '')
    .padEnd(32, '0')
    .slice(0, 32);

  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(13, 16)}-a${hex.slice(17, 20)}-${hex.slice(20, 32)}`;
};

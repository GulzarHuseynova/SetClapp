export const downloadBlob = (blob: Blob, fileName: string) => {
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  anchor.rel = 'noopener';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => window.URL.revokeObjectURL(url), 3000);
};

export const downloadTextFile = (
  content: string,
  fileName: string,
  mime = 'text/csv;charset=utf-8',
) => {
  downloadBlob(new Blob([content], { type: mime }), fileName);
};

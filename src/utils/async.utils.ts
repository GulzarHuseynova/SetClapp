// Elementləri ən çox `limit` qədər paralel emal edir; nəticələrin sırası giriş sırası ilə eynidir.
export const mapWithConcurrency = async <T, R>(items: T[], limit: number, mapper: (item: T) => Promise<R>) => {
  const results = new Array<R>(items.length);
  let nextIndex = 0;

  const worker = async () => {
    while (nextIndex < items.length) {
      const index = nextIndex;
      nextIndex += 1;
      results[index] = await mapper(items[index]);
    }
  };

  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
};

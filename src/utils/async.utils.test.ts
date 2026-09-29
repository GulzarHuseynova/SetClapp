import { describe, expect, it } from 'vitest';
import { mapWithConcurrency } from './async.utils';

describe('mapWithConcurrency', () => {
  it('keeps input order and never exceeds the limit', async () => {
    let running = 0;
    let peak = 0;
    const result = await mapWithConcurrency([30, 5, 20, 1, 10, 2], 2, async (ms) => {
      running += 1;
      peak = Math.max(peak, running);
      await new Promise((resolve) => setTimeout(resolve, ms));
      running -= 1;
      return ms * 10;
    });

    expect(result).toEqual([300, 50, 200, 10, 100, 20]);
    expect(peak).toBe(2);
  });

  it('handles an empty list', async () => {
    expect(await mapWithConcurrency([], 4, async (item) => item)).toEqual([]);
  });
});

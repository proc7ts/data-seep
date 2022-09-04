import { describe, expect, it } from '@jest/globals';
import { withValue } from './with-value.js';

describe('withValue', () => {
  it('seeps value', async () => {
    let sank: number | undefined;

    await withValue(13)(value => {
      sank = value ** 2;
    });

    expect(sank).toBe(169);
  });
});

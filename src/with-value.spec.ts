import { describe, expect, it } from '@jest/globals';
import { withValue } from './with-value.js';

describe('withValue', () => {
  it('seeps value', async () => {
    let sunk: number | undefined;

    await withValue(13)(value => {
      sunk = value ** 2;
    });

    expect(sunk).toBe(169);
  });
});

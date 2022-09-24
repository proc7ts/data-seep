import { describe, expect, it } from '@jest/globals';
import { neverSupply } from '@proc7ts/supply';
import { withValue } from './with-value.js';

describe('withValue', () => {
  it('seeps value', async () => {
    let sank: number | undefined;

    await withValue(13)(value => {
      sank = value ** 2;
    });

    expect(sank).toBe(169);
  });
  it('does not sink value when sink supply cut off', async () => {
    let sank: number | undefined;

    await withValue(13)(value => {
      sank = value;
    }, neverSupply());

    expect(sank).toBeUndefined();
  });
});

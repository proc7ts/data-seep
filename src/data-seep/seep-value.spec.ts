import { describe, expect, it } from '@jest/globals';
import { DataFaucet } from '../data-faucet.js';
import { withValue } from '../with-value.js';
import { DataSeeper } from './data-seeper.js';
import { seepValue } from './seep-value.js';

describe('seepValue', () => {
  it('seeps the given value', async () => {

    const seeper = new DataSeeper();

    seeper.assert(withTestData, seepValue(123));

    let sunk: number | undefined;

    await seeper.with(async seep => {
      await seep.do(withTestData)(value => {
        sunk = value;
      });
    });

    expect(sunk).toBe(123);
  });

  function withTestData(value: number): DataFaucet<number> {
    return withValue(value);
  }
});

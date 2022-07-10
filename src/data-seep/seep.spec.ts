import { describe, expect, it } from '@jest/globals';
import { DataFaucet } from '../data-faucet.js';
import { withValue } from '../with-value.js';
import { DataSeeper } from './data-seeper.js';
import { seep } from './seep.js';

describe('seep', () => {
  it('seeps with the given options', async () => {

    const seeper = new DataSeeper();

    seeper.assert(withTestData, seep(12, 34));

    let sunk: number | undefined;

    await seeper.with(async seep => {
      await seep.do(withTestData)(value => {
        sunk = value;
      });
    });

    expect(sunk).toBe(46);
  });

  function withTestData(first: number, second: number): DataFaucet<number> {
    return withValue(first + second);
  }
});

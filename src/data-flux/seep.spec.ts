import { describe, expect, it } from '@jest/globals';
import { DataFaucet } from '../data-faucet.js';
import { withValue } from '../with-value.js';
import { DataAssertions } from './data-assertions.js';
import { seep } from './seep.js';

describe('seep', () => {
  it('seeps with the given options', async () => {

    const assertions = new DataAssertions();

    assertions.assert(withTestData, seep(12, 34));

    let sunk: number | undefined;

    await assertions.with(async flux => {
      await flux.flow(withTestData)(value => {
        sunk = value;
      });
    });

    expect(sunk).toBe(46);
  });

  function withTestData(first: number, second: number): DataFaucet<number> {
    return withValue(first + second);
  }
});

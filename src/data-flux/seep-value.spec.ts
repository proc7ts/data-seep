import { describe, expect, it } from '@jest/globals';
import { DataFaucet } from '../data-faucet.js';
import { withValue } from '../with-value.js';
import { DataAssertions } from './data-assertions.js';
import { seepValue } from './seep-value.js';

describe('seepValue', () => {
  it('seeps the given value', async () => {

    const assertions = new DataAssertions();

    assertions.assert(withTestData, seepValue(123));

    let sunk: number | undefined;

    await assertions.with(async flux => {
      await flux.flow(withTestData)(value => {
        sunk = value;
      });
    });

    expect(sunk).toBe(123);
  });

  function withTestData(): DataFaucet<number> {
    return withValue(0);
  }
});

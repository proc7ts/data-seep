import { describe, expect, it } from '@jest/globals';
import { DataFaucet } from '../data-faucet.js';
import { withValue } from '../with-value.js';
import { DataMixer } from './data-mixer.js';
import { seepValue } from './seep-value.js';

describe('seepValue', () => {
  it('seeps the given value', async () => {
    const mixer = new DataMixer();

    mixer.mix(withTestData, seepValue(123));

    let sunk: number | undefined;

    await mixer.with(async mix => {
      await mix.flow(withTestData)(value => {
        sunk = value;
      });
    });

    expect(sunk).toBe(123);
  });

  function withTestData(): DataFaucet<number> {
    return withValue(0);
  }
});

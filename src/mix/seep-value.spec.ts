import { describe, expect, it } from '@jest/globals';
import { DataFaucet } from '../data-faucet.js';
import { withValue } from '../with-value.js';
import { DataMixer } from './data-mixer.js';
import { seepValue } from './seep-value.js';

describe('seepValue', () => {
  it('seeps the given value', async () => {
    const mixer = new DataMixer();

    mixer.infuse(withTestData, seepValue(123));

    let sank: number | undefined;

    await mixer.mix(async mix => {
      await mix.pour(withTestData)(value => {
        sank = value;
      });
    });

    expect(sank).toBe(123);
  });

  function withTestData(): DataFaucet<number> {
    return withValue(0);
  }
});

import { describe, expect, it } from '@jest/globals';
import { DataFaucet } from '../data-faucet.js';
import { withValue } from '../with-value.js';
import { DataMixer } from './data-mixer.js';
import { seep } from './data-seep.js';

describe('seep', () => {
  it('seeps with the given options', async () => {
    const mixer = new DataMixer();

    mixer.infuse(withTestData, seep(12, 34));

    let sank: number | undefined;

    await mixer.mix(async mix => {
      await mix.pour(withTestData)(value => {
        sank = value;
      });
    });

    expect(sank).toBe(46);
  });

  function withTestData(first: number, second: number): DataFaucet<number> {
    return withValue(first + second);
  }
});

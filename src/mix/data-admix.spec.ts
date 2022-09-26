import { describe, expect, it } from '@jest/globals';
import { DataFaucet } from '../data-faucet.js';
import { withValue } from '../infusions/with-value.js';
import { admix } from './data-admix.js';
import { DataMixer } from './data-mixer.js';

describe('admix', () => {
  it('creates faucet with the given options', async () => {
    const mixer = new DataMixer();

    mixer.add(admix(withTestData, 12, 34));

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

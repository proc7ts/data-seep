import { describe, expect, it } from '@jest/globals';
import { DataFaucet } from '../../data-faucet.js';
import { withValue } from '../../infusions/with-value.js';
import { admixValue } from './admix-value.js';
import { DataMixer } from '../data-mixer.js';

describe('admixValue', () => {
  it('pours the given value', async () => {
    const mixer = new DataMixer();

    mixer.add(admixValue(withTestData, 123));

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

import { describe, expect, it } from '@jest/globals';
import { Supply } from '@proc7ts/supply';
import { DataFaucet } from '../../data-faucet.js';
import { withValue } from '../../infusions/with-value.js';
import { BlendedAdmix } from '../blended.admix.js';
import { DataMixer } from '../data-mixer.js';
import { admixValue } from './admix-value.js';

describe('admixValue', () => {
  it('is single admix', () => {
    const admix = admixValue(13);

    expect(BlendedAdmix(admix)).not.toBe(admix);
  });
  it('pours the given value', async () => {
    const mixer = new DataMixer();

    mixer.add(withTestData, admixValue(123));

    const supply = new Supply();
    let sank: number | undefined;

    await mixer.mix(async mix => {
      await mix.pour(withTestData)(value => {
        sank = value;
        supply.off();
      }, supply);
    });

    expect(sank).toBe(123);
  });

  function withTestData(): DataFaucet<number> {
    return withValue(0);
  }
});

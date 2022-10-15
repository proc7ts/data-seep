import { describe, expect, it } from '@jest/globals';
import { Supply } from '@proc7ts/supply';
import { DataFaucet } from '../../data-faucet.js';
import { withValue } from '../../infusions/with-value.js';
import { BlendedAdmix } from '../blended.admix.js';
import { DataMixer } from '../data-mixer.js';
import { admix } from './admix.js';

describe('admix', () => {
  it('is single admix', () => {
    const admixInstance = admix();

    expect(BlendedAdmix(admixInstance)).not.toBe(admixInstance);
  });
  it('creates faucet with the given options', async () => {
    const mixer = new DataMixer();

    mixer.add(withTestData, admix(12, 34));

    const supply = new Supply();
    let sank: number | undefined;

    await mixer.mix(async mix => {
      await mix.pour(withTestData)(value => {
        sank = value;
        supply.done();
      }, supply);
    });

    expect(sank).toBe(46);
  });

  function withTestData(first: number, second: number): DataFaucet<number> {
    return withValue(first + second);
  }
});

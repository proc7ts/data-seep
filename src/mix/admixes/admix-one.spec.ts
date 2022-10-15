import { beforeEach, describe, expect, it } from '@jest/globals';
import { Supply } from '@proc7ts/supply';
import { DataFaucet } from '../../data-faucet.js';
import { withValue } from '../../infusions/with-value.js';
import { BlendedAdmix } from '../blended.admix.js';
import { DataMixer } from '../data-mixer.js';
import { admixOne } from './admix-one.js';
import { admixValue } from './admix-value.js';
import { admixWith } from './admix-with.js';

describe('admixOne', () => {
  let mixer: DataMixer;

  beforeEach(() => {
    mixer = new DataMixer();
  });

  it('is blended admix', () => {
    const admix = admixOne(admixValue(12));

    expect(BlendedAdmix(admix)).toBe(admix);
  });
  it('pours array with the given element', async () => {
    const supply = new Supply();
    let sank: number[] | undefined;

    mixer.add(withTestData, admixOne(admixValue(13)));

    await mixer.mix(async mix => {
      await mix.pour(withTestData)(value => {
        sank = value;
        supply.off();
      }, supply);
    });

    expect(sank).toEqual([13]);
  });
  it('handles addition', async () => {
    const supply = new Supply();
    let sank: number[] | undefined;

    const promise = mixer.mix(async mix => {
      await mix.pour(withTestData)(value => {
        sank = value;
      }, supply);
    });

    mixer.add(withTestData, admixOne(admixValue(13)));

    await new Promise(resolve => setImmediate(resolve));
    expect(sank).toEqual([13]);
    supply.off();
    await promise;
  });
  it('can not infuse element', async () => {
    const supply = new Supply();
    let sank: number[] | undefined;

    mixer.add(withTestData, admixOne(admixWith()));

    const promise = mixer.mix(async mix => {
      await mix.pour(withTestData)(value => {
        sank = value;
      }, supply);
    });

    await expect(promise).rejects.toThrow();
    expect(sank).toEqual([]);
  });

  function withTestData(array: number[] = []): DataFaucet<number[]> {
    return withValue(array);
  }
});

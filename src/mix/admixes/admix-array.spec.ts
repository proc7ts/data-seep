import { beforeEach, describe, expect, it } from '@jest/globals';
import { Supply } from '@proc7ts/supply';
import { DataFaucet } from '../../data-faucet.js';
import { withValue } from '../../infusions/with-value.js';
import { DataMixer } from '../data-mixer.js';
import { admixArray } from './admix-array.js';
import { admixValue } from './admix-value.js';

describe('admixArray', () => {
  let mixer: DataMixer;

  beforeEach(() => {
    mixer = new DataMixer();
  });

  it('pours the given array', async () => {
    const supply = new Supply();
    let sank: number[] | undefined;

    mixer.add(withTestData, admixArray(admixValue([1, 2, 3])));

    await mixer.mix(async mix => {
      await mix.pour(withTestData)(value => {
        sank = value;
        supply.off();
      }, supply);
    });

    expect(sank).toEqual([1, 2, 3]);
  });
  it('concatenates arrays', async () => {
    const supply = new Supply();
    let sank: number[] | undefined;

    mixer.add(withTestData, admixArray(admixValue([1, 2, 3])));
    mixer.add(withTestData, admixArray(admixValue([4, 5, 6])));

    await mixer.mix(async mix => {
      await mix.pour(withTestData)(value => {
        sank = value;
        supply.off();
      }, supply);
    });

    expect(sank).toEqual([1, 2, 3, 4, 5, 6]);
  });
  it('concatenates with previous admix', async () => {
    const supply = new Supply();
    let sank: number[] | undefined;

    mixer.add(withTestData, admixValue([1, 2, 3]));
    mixer.add(withTestData, admixArray(admixValue([4, 5, 6])));

    await mixer.mix(async mix => {
      await mix.pour(withTestData)(value => {
        sank = value;
        supply.off();
      }, supply);
    });

    expect(sank).toEqual([1, 2, 3, 4, 5, 6]);
  });
  it('concatenates with next admix', async () => {
    const supply = new Supply();
    let sank: number[] | undefined;

    mixer.add(withTestData, admixArray(admixValue([1, 2, 3])));
    mixer.add(withTestData, admixValue([4, 5, 6]));

    await mixer.mix(async mix => {
      await mix.pour(withTestData)(value => {
        sank = value;
        supply.off();
      }, supply);
    });

    expect(sank).toEqual([1, 2, 3, 4, 5, 6]);
  });

  describe('removal', () => {
    it('handles first array removal', async () => {
      const supply = new Supply();
      let sank: number[] | undefined;

      const handle1 = mixer.add(withTestData, admixArray(admixValue([1, 2, 3])));

      mixer.add(withTestData, admixArray(admixValue([4, 5, 6])));

      handle1.supply.off();

      await mixer.mix(async mix => {
        await mix.pour(withTestData)(value => {
          sank = value;
          supply.off();
        }, supply);
      });

      expect(sank).toEqual([4, 5, 6]);
    });
    it('handles second array removal', async () => {
      const supply = new Supply();
      let sank: number[] | undefined;

      mixer.add(withTestData, admixArray(admixValue([1, 2, 3])));

      const handle2 = mixer.add(withTestData, admixArray(admixValue([4, 5, 6])));

      handle2.supply.off();

      await mixer.mix(async mix => {
        await mix.pour(withTestData)(value => {
          sank = value;
          supply.off();
        }, supply);
      });

      expect(sank).toEqual([1, 2, 3]);
    });
  });

  function withTestData(array: number[] = []): DataFaucet<number[]> {
    return withValue(array);
  }
});

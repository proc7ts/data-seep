import { beforeEach, describe, expect, it } from '@jest/globals';
import { Supply } from '@proc7ts/supply';
import { DataFaucet } from '../../data-faucet.js';
import { withValue } from '../../infusions/with-value.js';
import { BlendedAdmix } from '../blended.admix.js';
import { DataMixer } from '../data-mixer.js';
import { admixArray } from './admix-array.js';
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

  describe('with three elements', () => {
    it('concatenates elements', async () => {
      const supply = new Supply();
      let sank: number[] | undefined;

      mixer.add(withTestData, admixOne(admixValue(1)));
      mixer.add(withTestData, admixOne(admixValue(2)));
      mixer.add(withTestData, admixOne(admixValue(3)));

      await mixer.mix(async mix => {
        await mix.pour(withTestData)(value => {
          sank = value;
          supply.off();
        }, supply);
      });

      expect(sank).toEqual([1, 2, 3]);
    });
    it('handles middle element removal', async () => {
      const supply = new Supply();
      let sank: number[] | undefined;

      mixer.add(withTestData, admixOne(admixValue(1)));

      const handle2 = mixer.add(withTestData, admixOne(admixValue(2)));

      mixer.add(withTestData, admixOne(admixValue(3)));

      handle2.supply.off();

      await mixer.mix(async mix => {
        await mix.pour(withTestData)(value => {
          sank = value;
          supply.off();
        }, supply);
      });

      expect(sank).toEqual([1, 3]);
    });
  });

  describe('before array', () => {
    it('concatenates arrays', async () => {
      const supply = new Supply();
      let sank: number[] | undefined;

      mixer.add(withTestData, admixOne(admixValue(1)));
      mixer.add(withTestData, admixArray(admixValue([2, 3])));

      await mixer.mix(async mix => {
        await mix.pour(withTestData)(value => {
          sank = value;
          supply.off();
        }, supply);
      });

      expect(sank).toEqual([1, 2, 3]);
    });
    it('handles array addition', async () => {
      const supply = new Supply();
      const sank: number[][] = [];

      mixer.add(withTestData, admixOne(admixValue(1)));

      const promise = mixer.mix(async mix => {
        await mix.pour(withTestData)(value => {
          sank.push(value);
        }, supply);
      });

      await new Promise(resolve => setImmediate(resolve));
      expect(sank).toEqual([[1]]);

      mixer.add(withTestData, admixArray(admixValue([2, 3])));
      await new Promise(resolve => setImmediate(resolve));
      expect(sank).toEqual([[1], [1, 2, 3]]);

      supply.off();
      await promise;
    });
    it('handles element removal', async () => {
      const supply = new Supply();
      let sank: number[] | undefined;

      const handle1 = mixer.add(withTestData, admixOne(admixValue(1)));

      mixer.add(withTestData, admixArray(admixValue([2, 3])));

      handle1.supply.off();

      await mixer.mix(async mix => {
        await mix.pour(withTestData)(value => {
          sank = value;
          supply.off();
        }, supply);
      });

      expect(sank).toEqual([2, 3]);
    });
    it('handles array removal', async () => {
      const supply = new Supply();
      let sank: number[] | undefined;

      mixer.add(withTestData, admixOne(admixValue(1)));

      const handle2 = mixer.add(withTestData, admixArray(admixValue([2, 3])));

      handle2.supply.off();

      await mixer.mix(async mix => {
        await mix.pour(withTestData)(value => {
          sank = value;
          supply.off();
        }, supply);
      });

      expect(sank).toEqual([1]);
    });
  });

  describe('after array', () => {
    it('concatenates arrays', async () => {
      const supply = new Supply();
      let sank: number[] | undefined;

      mixer.add(withTestData, admixArray(admixValue([1, 2])));
      mixer.add(withTestData, admixOne(admixValue(3)));

      await mixer.mix(async mix => {
        await mix.pour(withTestData)(value => {
          sank = value;
          supply.off();
        }, supply);
      });

      expect(sank).toEqual([1, 2, 3]);
    });
    it('handles element addition', async () => {
      const supply = new Supply();
      const sank: number[][] = [];

      mixer.add(withTestData, admixArray(admixValue([1, 2])));

      const promise = mixer.mix(async mix => {
        await mix.pour(withTestData)(value => {
          sank.push(value);
        }, supply);
      });

      await new Promise(resolve => setImmediate(resolve));
      expect(sank).toEqual([[1, 2]]);

      mixer.add(withTestData, admixOne(admixValue(3)));
      await new Promise(resolve => setImmediate(resolve));
      expect(sank).toEqual([
        [1, 2],
        [1, 2, 3],
      ]);

      supply.off();
      await promise;
    });

    it('handles array removal', async () => {
      const supply = new Supply();
      let sank: number[] | undefined;

      const handle1 = mixer.add(withTestData, admixArray(admixValue([1, 2])));

      mixer.add(withTestData, admixOne(admixValue(3)));

      handle1.supply.off();

      await mixer.mix(async mix => {
        await mix.pour(withTestData)(value => {
          sank = value;
          supply.off();
        }, supply);
      });

      expect(sank).toEqual([3]);
    });
    it('handles element removal', async () => {
      const supply = new Supply();
      let sank: number[] | undefined;

      mixer.add(withTestData, admixArray(admixValue([1, 2])));

      const handle2 = mixer.add(withTestData, admixOne(admixValue(3)));

      handle2.supply.off();

      await mixer.mix(async mix => {
        await mix.pour(withTestData)(value => {
          sank = value;
          supply.off();
        }, supply);
      });

      expect(sank).toEqual([1, 2]);
    });
  });

  function withTestData(array: number[] = []): DataFaucet<number[]> {
    return withValue(array);
  }
});

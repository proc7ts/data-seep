import { beforeEach, describe, expect, it } from '@jest/globals';
import { neverSupply, Supply } from '@proc7ts/supply';
import { DataFaucet } from '../../data-faucet.js';
import { withValue } from '../../infusions/with-value.js';
import { BlendedAdmix } from '../blended.admix.js';
import { DataMixer } from '../data-mixer.js';
import { admixArray } from './admix-array.js';
import { admixValue } from './admix-value.js';

describe('admixArray', () => {
  let mixer: DataMixer;

  beforeEach(() => {
    mixer = new DataMixer();
  });

  it('is blended admix', () => {
    const admix = admixArray(admixValue([]));

    expect(BlendedAdmix(admix)).toBe(admix);
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
  it('handles addition', async () => {
    const supply = new Supply();
    let sank: number[] | undefined;

    const promise = mixer.mix(async mix => {
      await mix.pour(withTestData)(value => {
        sank = value;
      }, supply);
    });

    mixer.add(withTestData, admixArray(admixValue([1, 2, 3])));

    await new Promise(resolve => setImmediate(resolve));
    expect(sank).toEqual([1, 2, 3]);
    supply.off();
    await promise;
  });

  describe('with three arrays', () => {
    it('concatenates arrays', async () => {
      const supply = new Supply();
      let sank: number[] | undefined;

      mixer.add(withTestData, admixArray(admixValue([1, 2, 3])));
      mixer.add(withTestData, admixArray(admixValue([4, 5, 6])));
      mixer.add(withTestData, admixArray(admixValue([7, 8, 9])));

      await mixer.mix(async mix => {
        await mix.pour(withTestData)(value => {
          sank = value;
          supply.off();
        }, supply);
      });

      expect(sank).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    });
    it('handles middle array removal', async () => {
      const supply = new Supply();
      let sank: number[] | undefined;

      mixer.add(withTestData, admixArray(admixValue([1, 2, 3])));

      const handle2 = mixer.add(withTestData, admixArray(admixValue([4, 5, 6])));

      mixer.add(withTestData, admixArray(admixValue([7, 8, 9])));

      handle2.supply.off();

      await mixer.mix(async mix => {
        await mix.pour(withTestData)(value => {
          sank = value;
          supply.off();
        }, supply);
      });

      expect(sank).toEqual([1, 2, 3, 7, 8, 9]);
    });
  });

  describe('with two arrays', () => {
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
    it('handles array addition', async () => {
      const supply = new Supply();
      const sank: number[][] = [];

      mixer.add(withTestData, admixArray(admixValue([1, 2, 3])));

      const promise = mixer.mix(async mix => {
        await mix.pour(withTestData)(value => {
          sank.push(value);
        }, supply);
      });

      await new Promise(resolve => setImmediate(resolve));
      expect(sank).toEqual([[1, 2, 3]]);

      mixer.add(withTestData, admixArray(admixValue([4, 5, 6])));
      await new Promise(resolve => setImmediate(resolve));
      expect(sank).toEqual([
        [1, 2, 3],
        [1, 2, 3, 4, 5, 6],
      ]);

      supply.off();
      await promise;
    });
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

  describe('with array after value', () => {
    it('concatenates arrays', async () => {
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
    it('handles array addition', async () => {
      const supply = new Supply();
      const sank: number[][] = [];

      mixer.add(withTestData, admixValue([1, 2, 3]));

      const promise = mixer.mix(async mix => {
        await mix.pour(withTestData)(value => {
          sank.push(value);
        }, supply);
      });

      await new Promise(resolve => setImmediate(resolve));
      expect(sank).toEqual([[1, 2, 3]]);

      mixer.add(withTestData, admixArray(admixValue([4, 5, 6])));
      await new Promise(resolve => setImmediate(resolve));
      expect(sank).toEqual([
        [1, 2, 3],
        [1, 2, 3, 4, 5, 6],
      ]);

      supply.off();
      await promise;
    });
    it('handles value removal', async () => {
      const supply = new Supply();
      let sank: number[] | undefined;

      const handle1 = mixer.add(withTestData, admixValue([1, 2, 3]));

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
    it('handles array removal', async () => {
      const supply = new Supply();
      let sank: number[] | undefined;

      mixer.add(withTestData, admixValue([1, 2, 3]));

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

  describe('with value after array', () => {
    it('concatenates arrays', async () => {
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
    it('ignores completed value', async () => {
      const supply = new Supply();
      let sank: number[] | undefined;

      mixer.add(withTestData, admixArray(admixValue([1, 2, 3])));
      mixer.add(withTestData, {
        supply: neverSupply(),
        pour: () => {
          throw new Error('Should never happen');
        },
      });

      await mixer.mix(async mix => {
        await mix.pour(withTestData)(value => {
          sank = value;
          supply.off();
        }, supply);
      });

      expect(sank).toEqual([1, 2, 3]);
    });
    it('handles value addition', async () => {
      const supply = new Supply();
      const sank: number[][] = [];

      mixer.add(withTestData, admixArray(admixValue([1, 2, 3])));

      const promise = mixer.mix(async mix => {
        await mix.pour(withTestData)(value => {
          sank.push(value);
        }, supply);
      });

      await new Promise(resolve => setImmediate(resolve));
      expect(sank).toEqual([[1, 2, 3]]);

      mixer.add(withTestData, admixValue([4, 5, 6]));
      await new Promise(resolve => setImmediate(resolve));
      expect(sank).toEqual([
        [1, 2, 3],
        [1, 2, 3, 4, 5, 6],
      ]);

      supply.off();
      await promise;
    });

    it('handles array removal', async () => {
      const supply = new Supply();
      let sank: number[] | undefined;

      const handle1 = mixer.add(withTestData, admixArray(admixValue([1, 2, 3])));

      mixer.add(withTestData, admixValue([4, 5, 6]));

      handle1.supply.off();

      await mixer.mix(async mix => {
        await mix.pour(withTestData)(value => {
          sank = value;
          supply.off();
        }, supply);
      });

      expect(sank).toEqual([4, 5, 6]);
    });
    it('handles value removal', async () => {
      const supply = new Supply();
      let sank: number[] | undefined;

      mixer.add(withTestData, admixArray(admixValue([1, 2, 3])));

      const handle2 = mixer.add(withTestData, admixValue([4, 5, 6]));

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

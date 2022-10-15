import { beforeEach, describe, expect, it } from '@jest/globals';
import { neverSupply, Supply } from '@proc7ts/supply';
import { DataFaucet } from '../data-faucet.js';
import { withValue } from '../infusions/with-value.js';
import { admix } from './admixes/mod.js';
import { DataMixer } from './data-mixer.js';

describe('DataMixer', () => {
  let mixer: DataMixer;

  beforeEach(() => {
    mixer = new DataMixer();
  });

  describe('add', () => {
    it('replaces previous admix', async () => {
      const handle1 = mixer.add(withTestData, admix(1));

      expect(handle1.supply.isOff).toBeNull();

      const handle2 = mixer.add(withTestData, admix(2));

      expect(handle1.supply.isOff?.failed).toBe(false);
      expect(handle2.supply.isOff).toBeNull();

      const supply = new Supply();
      let sank: number | undefined;

      await mixer.mix(async mix => {
        await mix.pour(withTestData)(value => {
          sank = value;
          supply.done();
        }, supply);
      });

      expect(sank).toBe(2);
    });
    it('does not add completed admix', async () => {
      const handle = mixer.add(withTestData, {
        supply: neverSupply(),
        pour: () => withTestData(13),
      });

      const supply = new Supply();
      let sank: number | undefined;

      const whenSank = mixer.mix(async mix => {
        await mix.pour(withTestData)(value => {
          sank = value;
        }, supply);
      });

      await new Promise(resolve => setImmediate(resolve));
      supply.done();
      await whenSank;
      await handle.whenSank();

      expect(sank).toBeUndefined();
    });
    it('removes existing admix by completed single one', async () => {
      mixer.add(withTestData, admix(1));

      const handle = mixer.add(withTestData, {
        supply: neverSupply(),
        pour: () => withTestData(13),
      });

      const supply = new Supply();
      let sank: number | undefined;

      const whenSank = mixer.mix(async mix => {
        await mix.pour(withTestData)(value => {
          sank = value;
        }, supply);
      });

      await new Promise(resolve => setImmediate(resolve));
      supply.done();
      await whenSank;
      await handle.whenSank();

      expect(sank).toBeUndefined();
    });
    it('removes existing admix by completed blended one', async () => {
      mixer.add(withTestData, admix(1));

      const handle = mixer.add(withTestData, {
        supply: neverSupply(),
        blend: () => {
          throw new Error('Should never happen');
        },
        replace: () => {
          throw new Error('Should never happen');
        },
      });

      const supply = new Supply();
      let sank: number | undefined;

      const whenSank = mixer.mix(async mix => {
        await mix.pour(withTestData)(value => {
          sank = value;
        }, supply);
      });

      await new Promise(resolve => setImmediate(resolve));
      supply.done();
      await whenSank;
      await handle.whenSank();

      expect(sank).toBeUndefined();
    });
  });

  function withTestData(value: number): DataFaucet<number> {
    return withValue(value);
  }
});

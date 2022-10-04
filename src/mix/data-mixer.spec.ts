import { beforeEach, describe, expect, it } from '@jest/globals';
import { neverSupply } from '@proc7ts/supply';
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

      let sank: number | undefined;

      await mixer.mix(async mix => {
        await mix.pour(withTestData)(value => {
          sank = value;
        });
      });

      expect(sank).toBe(2);
    });
    it('does not add completed admix', async () => {
      mixer.add(withTestData, admix(1));

      const handle = mixer.add(withTestData, {
        supply: neverSupply(),
        pour: () => withTestData(13),
      });

      let sank: number | undefined;

      await mixer.mix(async mix => {
        await mix.pour(withTestData)(value => {
          sank = value;
        });
      });
      await handle.whenSank();

      expect(sank).toBeUndefined();
    });
  });

  function withTestData(value: number): DataFaucet<number> {
    return withValue(value);
  }
});

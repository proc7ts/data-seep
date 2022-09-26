import { beforeEach, describe, expect, it } from '@jest/globals';
import { noop } from '@proc7ts/primitives';
import { neverSupply } from '@proc7ts/supply';
import { DataFaucet } from '../data-faucet.js';
import { DataInfusion } from '../data-infusion.js';
import { withValue } from '../infusions/with-value.js';
import { admix } from './data-admix.js';
import { DataInfusionError } from './data-infusion.error.js';
import { DataMixer } from './data-mixer.js';

describe('DataMixer', () => {
  let mixer: DataMixer;

  beforeEach(() => {
    mixer = new DataMixer();
  });

  describe('add', () => {
    it('replaces previous admix', async () => {
      const supply1 = mixer.add(admix(withTestData, 1));

      expect(supply1.isOff).toBeNull();

      const supply2 = mixer.add(admix(withTestData, 2));

      expect(supply1.isOff?.failed).toBe(false);
      expect(supply2.isOff).toBeNull();

      let sank: number | undefined;

      await mixer.mix(async mix => {
        await mix.pour(withTestData)(value => {
          sank = value;
        });
      });

      expect(sank).toBe(2);
    });
    it('does not add completed admix', async () => {
      mixer.add(admix(withTestData, 1));

      mixer.add({
        infuse: withTestData,
        supply: neverSupply(),
        pour: () => withTestData(13),
      });

      await expect(
        mixer.mix(async mix => {
          await mix.pour(withTestData)(noop);
        }),
      ).rejects.toThrow(
        new DataInfusionError(undefined, {
          infusion: withTestData as DataInfusion<unknown, unknown[]>,
        }),
      );
    });
  });

  function withTestData(value: number): DataFaucet<number> {
    return withValue(value);
  }
});

import { beforeEach, describe, expect, it } from '@jest/globals';
import { noop } from '@proc7ts/primitives';
import { neverSupply } from '@proc7ts/supply';
import { DataFaucet } from '../data-faucet.js';
import { DataInfusion } from '../data-infusion.js';
import { withValue } from '../with-value.js';
import { DataInfusionError } from './data-infusion.error.js';
import { DataMixer } from './data-mixer.js';

describe('DataMix', () => {
  let mixer: DataMixer;

  beforeEach(() => {
    mixer = new DataMixer();
  });

  describe('pour', () => {
    it('provides access to infused data', async () => {
      mixer.add({ infusion: withTestData, pour: () => withTestData(1) });

      let sank: number | undefined;

      await mixer.mix(async mix => {
        await mix.pour(withTestData)(value => {
          sank = value;
        });
      });

      expect(sank).toBe(1);
    });
    it('respects sink supply', async () => {
      mixer.add({ infusion: withTestData, pour: () => withTestData(1) });

      let sank: number | undefined;

      await mixer.mix(async mix => {
        await mix.pour(withTestData)(value => {
          sank = value;
        }, neverSupply());
      });

      expect(sank).toBeUndefined();
    });
    it('fails if no data infused', async () => {
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

  describe('pourAll', () => {
    it('provides access to infused data', async () => {
      mixer.add({ infusion: withTestData, pour: () => withTestData(1) });
      mixer.add({ infusion: withTestData2, pour: () => withTestData2('test') });

      let sank: { first: number; second: string } | undefined;

      await mixer.mix(async mix => {
        await mix.pourAll({ first: withTestData, second: withTestData2 })(value => {
          sank = value;
        });
      });

      expect(sank).toEqual({ first: 1, second: 'test' });
    });
  });

  function withTestData(value: number): DataFaucet<number> {
    return withValue(value);
  }

  function withTestData2(value: string): DataFaucet<string> {
    return withValue(value);
  }
});

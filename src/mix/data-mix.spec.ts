import { beforeEach, describe, expect, it } from '@jest/globals';
import { neverSupply, Supply } from '@proc7ts/supply';
import { DataFaucet } from '../data-faucet.js';
import { withValue } from '../infusions/with-value.js';
import { DataMixer } from './data-mixer.js';

describe('DataMix', () => {
  let mixer: DataMixer;

  beforeEach(() => {
    mixer = new DataMixer();
  });

  describe('pour', () => {
    it('pours infused data', async () => {
      mixer.add(withTestData, { pour: () => withTestData(1) });

      const supply = new Supply();
      let sank: number | undefined;

      await mixer.mix(async mix => {
        await mix.pour(withTestData)(value => {
          sank = value;
          supply.done();
        }, supply);
      });

      expect(sank).toBe(1);
    });
    it('pours nothing if no data infused', async () => {
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

      expect(sank).toBeUndefined();
    });
    it('respects sink supply', async () => {
      mixer.add(withTestData, { pour: () => withTestData(1) });

      let sank: number | undefined;

      await mixer.mix(async mix => {
        await mix.pour(withTestData)(value => {
          sank = value;
        }, neverSupply());
      });

      expect(sank).toBeUndefined();
    });
  });

  describe('pourAll', () => {
    it('provides access to infused data', async () => {
      mixer.add(withTestData, { pour: () => withTestData(1) });
      mixer.add(withTestData2, { pour: () => withTestData2('test') });

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

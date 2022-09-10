import { beforeEach, describe, expect, it } from '@jest/globals';
import { noop } from '@proc7ts/primitives';
import { DataFaucet } from '../data-faucet.js';
import { DataInfusion } from '../data-infusion.js';
import { withValue } from '../with-value.js';
import { DataCompound } from './data-compound.js';
import { DataInfusionError } from './data-infusion.error.js';
import { DataMixer } from './data-mixer.js';
import { DefaultDataMix } from './default-data-mix.js';

describe('DataMix', () => {
  let mixer: DataMixer;

  beforeEach(() => {
    mixer = new DataMixer();
  });

  describe('pour', () => {
    it('provides access to infused data', async () => {
      mixer.infuse(withTestData, infusion => infusion(1));

      let sank: number | undefined;

      await mixer.mix(async mix => {
        await mix.pour(withTestData)(value => {
          sank = value;
        });
      });

      expect(sank).toBe(1);
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
    it('pours nothing if compound supply completed', async () => {
      class TestMixer extends DataMixer {

        constructor() {
          super((compound: DataCompound) => {
            compound.supply.off();

            return withValue(new DefaultDataMix(compound));
          });
        }

}

      mixer = new TestMixer();
      mixer.infuse(withTestData, infusion => infusion(1));

      let sank: number | undefined;

      await mixer.mix(async mix => {
        await mix.pour(withTestData)(value => {
          sank = value;
        });
      });

      expect(sank).toBeUndefined();
    });
    it('fails to pour if compound supply failed', async () => {
      class TestAssertions extends DataMixer {

        constructor() {
          super((compound: DataCompound) => {
            compound.supply.whenOff(noop).off('Test error');

            return withValue(new DefaultDataMix(compound));
          });
        }

}

      mixer = new TestAssertions();
      mixer.infuse(withTestData, infusion => infusion(1));

      await expect(
        mixer.mix(async mix => {
          await mix.pour(withTestData)(noop);
        }),
      ).rejects.toBe('Test error');
    });
  });

  describe('pourAll', () => {
    it('provides access to infused data', async () => {
      mixer.infuse(withTestData, infusion => infusion(1));
      mixer.infuse(withTestData2, infusion => infusion('test'));

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
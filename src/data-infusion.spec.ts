import { beforeEach, describe, expect, it } from '@jest/globals';
import { Supply } from '@proc7ts/supply';
import { DataInfusion } from './data-infusion.js';
import { withValue } from './infusions/with-value.js';
import { admixWith } from './mix/admixes/admix-with.js';
import { DataAdmix } from './mix/data-admix.js';
import { DataMix } from './mix/data-mix.js';
import { DataMixer } from './mix/data-mixer.js';
import { mapSeep } from './seeps/map.seep.js';

describe('DataInfusion', () => {
  describe('name', () => {
    it('defaults to original one', () => {
      const withTestValue = DataInfusion(withValue);

      expect(withTestValue).not.toBe(withValue);
      expect(withTestValue.name).toBe(withValue.name);
    });
    it('replaced with custom one', () => {
      const withTestValue = DataInfusion(withValue, { name: 'withTestValue' });

      expect(withTestValue.name).toBe('withTestValue');
    });
  });

  describe('infuser', () => {
    let mixer: DataMixer;

    beforeEach(() => {
      mixer = new DataMixer();
    });

    it('defaults to no-op', async () => {
      const withTestValue = DataInfusion(withValue<number>);

      mixer.add(withTestValue, admixWith(1));

      const supply = new Supply();
      let sank: number | undefined;

      await mixer.mix(async mix => {
        await mix.pour(withTestValue)(value => {
          sank = value;
          supply.done();
        }, supply);
      });

      expect(sank).toBe(1);
    });
    it('customizes data', async () => {
      const withTestValue = DataInfusion(withValue<number>, {
        into<TMix extends DataMix>(_mixer: DataMixer<TMix>) {
          return {
            watch<TUpdate extends DataAdmix.Update<number, [number | PromiseLike<number>]>>() {
              return mapSeep((update: TUpdate): TUpdate => {
                if (!update.faucet) {
                  return update;
                }

                return {
                  ...update,
                  faucet: mapSeep((value: number) => value + 100)(update.faucet),
                };
              });
            },
          };
        },
      });

      mixer.add(withTestValue, admixWith(1));

      const supply = new Supply();
      let sank: number | undefined;

      await mixer.mix(async mix => {
        await mix.pour(withTestValue)(value => {
          sank = value;
          supply.done();
        }, supply);
      });

      expect(sank).toBe(101);
    });
  });
});

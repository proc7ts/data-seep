import { beforeEach, describe, expect, it } from '@jest/globals';
import { Supply } from '@proc7ts/supply';
import { DataInfusion } from './data-infusion.js';
import { withValue } from './infusions/with-value.js';
import { admixWith } from './mix/admixes/admix-with.js';
import { DataAdmix } from './mix/data-admix.js';
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

  describe('Infuser', () => {
    let mixer: DataMixer;

    beforeEach(() => {
      mixer = new DataMixer();
    });

    describe('watch', () => {
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
          into() {
            return {
              watch<TUpdate extends DataAdmix.Update<number, [number | PromiseLike<number>]>>() {
                return mapSeep(
                  (update: TUpdate): DataAdmix.Update<number, [number | PromiseLike<number>]> => {
                    if (!update.faucet) {
                      return update;
                    }

                    return {
                      ...update,
                      faucet: mapSeep((value: number) => value + 100)(update.faucet),
                    };
                  },
                );
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

    describe('seep', () => {
      it('customizes data', async () => {
        const withTestValue = DataInfusion(withValue<number>, {
          into() {
            return {
              seep() {
                return mapSeep((value: number) => value + 100);
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
    it('is applied after watcher seep', async () => {
      const withTestValue = DataInfusion(withValue<number>, {
        into() {
          return {
            watch<TUpdate extends DataAdmix.Update<number, [number | PromiseLike<number>]>>() {
              return mapSeep(
                (update: TUpdate): DataAdmix.Update<number, [number | PromiseLike<number>]> => {
                  if (!update.faucet) {
                    return update;
                  }

                  return {
                    ...update,
                    faucet: mapSeep((value: number) => value + 100)(update.faucet),
                  };
                },
              );
            },
            seep() {
              return mapSeep((value: number) => value * 10);
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

      expect(sank).toBe(1010);
    });
    it('handles admix replacement', async () => {
      const withTestValue = DataInfusion(withValue<number>, {
        into() {
          return {
            seep() {
              return mapSeep((value: number) => value + 100);
            },
          };
        },
      });

      mixer.add(withTestValue, admixWith(1));

      const supply = new Supply();
      const sank: number[] = [];

      const promise = mixer.mix(async mix => {
        await mix.pour(withTestValue)(value => {
          sank.push(value);
        }, supply);
      });

      await new Promise<void>(resolve => setImmediate(resolve));
      expect(sank).toEqual([101]);

      mixer.add(withTestValue, admixWith(2));

      await new Promise<void>(resolve => setImmediate(resolve));
      expect(sank).toEqual([101, 102]);

      supply.done();
      await promise;
    });
  });
});

import { beforeEach, describe, expect, it } from '@jest/globals';
import { noop } from '@proc7ts/primitives';
import { DataFaucet } from '../data-faucet.js';
import { DataInfusion } from '../data-infusion.js';
import { withValue } from '../with-value.js';
import { DataCompound } from './data-compound.js';
import { DataMixer } from './data-mixer.js';
import { DataSinkError } from './data-sink.error.js';
import { DefaultDataMix } from './default-data-mix.js';

describe('DataMix', () => {

  let mixer: DataMixer;

  beforeEach(() => {
    mixer = new DataMixer();
  });

  it('provides access to mixed in data', async () => {
    mixer.mix(withTestData, infusion => infusion(1));

    let sunk: number | undefined;

    await mixer.with(async mix => {
      await mix.flow(withTestData)(value => {
        sunk = value;
      });
    });

    expect(sunk).toBe(1);
  });
  it('fails if no data mixed', async () => {
    await expect(mixer.with(async mix => {
      await mix.flow(withTestData)(noop);
    })).rejects.toThrow(new DataSinkError(undefined, { infusion: withTestData as DataInfusion<unknown, unknown[]> }));
  });
  it('seeps nothing if intake supply completed', async () => {

    class TestMixer extends DataMixer {

      constructor() {
        super((compound: DataCompound) => {
          compound.supply.off();

          return withValue(new DefaultDataMix(compound));
        });
      }

    }

    mixer = new TestMixer();
    mixer.mix(withTestData, infusion => infusion(1));

    let sunk: number | undefined;

    await mixer.with(async mix => {
      await mix.flow(withTestData)(value => {
        sunk = value;
      });
    });

    expect(sunk).toBeUndefined();
  });
  it('fails if intake supply failed', async () => {

    class TestAssertions extends DataMixer {

      constructor() {
        super((compound: DataCompound) => {
          compound.supply.whenOff(noop).off('Test error');

          return withValue(new DefaultDataMix(compound));
        });
      }

    }

    mixer = new TestAssertions();
    mixer.mix(withTestData, infusion => infusion(1));

    await expect(mixer.with(async mix => {
      await mix.flow(withTestData)(noop);
    })).rejects.toBe('Test error');
  });

  function withTestData(value: number): DataFaucet<number> {
    return withValue(value);
  }
});

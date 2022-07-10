import { beforeEach, describe, expect, it } from '@jest/globals';
import { noop } from '@proc7ts/primitives';
import { DataFaucet, FaucetKind } from '../data-faucet.js';
import { withValue } from '../with-value.js';
import { DataSeep } from './data-seep.js';
import { DataSeeper } from './data-seeper.js';
import { DataSinkError } from './data-sink.error.js';
import { DefaultDataSeep } from './default-data-seep.js';

describe('DataSeep', () => {

  let seeper: DataSeeper;

  beforeEach(() => {
    seeper = new DataSeeper();
  });

  it('provides access to asserted data', async () => {
    seeper.assert(withTestData, kind => kind(1));

    let sunk: number | undefined;

    await seeper.with(async seep => {
      await seep.do(withTestData)(value => {
        sunk = value;
      });
    });

    expect(sunk).toBe(1);
  });
  it('fails if no data asserted', async () => {
    await expect(seeper.with(async seep => {
      await seep.do(withTestData)(noop);
    })).rejects.toThrow(new DataSinkError(undefined, { faucetKind: withTestData as FaucetKind<unknown, unknown[]> }));
  });
  it('seeps nothing if intake supply completedoff', async () => {

    class TestSeeper extends DataSeeper {

      constructor() {
        super((seeper: DataSeep.Seeper) => {
          seeper.supply.off();

          return withValue(new DefaultDataSeep(seeper));
        });
      }

    }

    seeper = new TestSeeper();
    seeper.assert(withTestData, kind => kind(1));

    let sunk: number | undefined;

    await seeper.with(async seep => {
      await seep.do(withTestData)(value => {
        sunk = value;
      });
    });

    expect(sunk).toBeUndefined();
  });
  it('fails if intake supply failed', async () => {

    class TestSeeper extends DataSeeper {

      constructor() {
        super((seeper: DataSeep.Seeper) => {
          seeper.supply.whenOff(noop).off('Test error');

          return withValue(new DefaultDataSeep(seeper));
        });
      }

    }

    seeper = new TestSeeper();
    seeper.assert(withTestData, kind => kind(1));

    await expect(seeper.with(async seep => {
      await seep.do(withTestData)(noop);
    })).rejects.toBe('Test error');
  });

  function withTestData(value: number): DataFaucet<number> {
    return withValue(value);
  }
});

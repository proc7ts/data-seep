import { beforeEach, describe, expect, it } from '@jest/globals';
import { noop } from '@proc7ts/primitives';
import { DataFaucet, FaucetKind } from '../data-faucet.js';
import { withValue } from '../with-value.js';
import { DataAssertions } from './data-assertions.js';
import { DataFlux } from './data-flux.js';
import { DataSinkError } from './data-sink.error.js';
import { DefaultDataFlux } from './default-data-flux.js';

describe('DataFlow', () => {

  let assertions: DataAssertions;

  beforeEach(() => {
    assertions = new DataAssertions();
  });

  it('provides access to asserted data', async () => {
    assertions.assert(withTestData, kind => kind(1));

    let sunk: number | undefined;

    await assertions.with(async flux => {
      await flux.flow(withTestData)(value => {
        sunk = value;
      });
    });

    expect(sunk).toBe(1);
  });
  it('fails if no data asserted', async () => {
    await expect(assertions.with(async flux => {
      await flux.flow(withTestData)(noop);
    })).rejects.toThrow(new DataSinkError(undefined, { faucetKind: withTestData as FaucetKind<unknown, unknown[]> }));
  });
  it('seeps nothing if intake supply completed', async () => {

    class TestAssertions extends DataAssertions {

      constructor() {
        super((source: DataFlux.Source) => {
          source.supply.off();

          return withValue(new DefaultDataFlux(source));
        });
      }

    }

    assertions = new TestAssertions();
    assertions.assert(withTestData, kind => kind(1));

    let sunk: number | undefined;

    await assertions.with(async flux => {
      await flux.flow(withTestData)(value => {
        sunk = value;
      });
    });

    expect(sunk).toBeUndefined();
  });
  it('fails if intake supply failed', async () => {

    class TestAssertions extends DataAssertions {

      constructor() {
        super((source: DataFlux.Source) => {
          source.supply.whenOff(noop).off('Test error');

          return withValue(new DefaultDataFlux(source));
        });
      }

    }

    assertions = new TestAssertions();
    assertions.assert(withTestData, kind => kind(1));

    await expect(assertions.with(async flux => {
      await flux.flow(withTestData)(noop);
    })).rejects.toBe('Test error');
  });

  function withTestData(value: number): DataFaucet<number> {
    return withValue(value);
  }
});

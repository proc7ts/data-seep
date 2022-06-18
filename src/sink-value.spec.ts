import { describe, expect, it } from '@jest/globals';
import { PromiseResolver } from '@proc7ts/async';
import { Supply } from '@proc7ts/supply';
import { DataSink } from './data-sink.js';
import { sinkValue } from './sink-value.js';

describe('sinkValue', () => {
  it('sinks data synchronously', async () => {

    const { resolve, whenDone } = new PromiseResolver<void>();
    let sunk: number | undefined;

    const sink: DataSink<number> = async value => {
      await whenDone();
      sunk = value;
    };

    const promise = sinkValue(13, sink);

    await new Promise<void>(resolve => setTimeout(resolve, 1));
    expect(sunk).toBeUndefined();

    resolve();
    await expect(promise).resolves.toBeUndefined();
    expect(sunk).toBe(13);
  });
  it('resolves when data sunk', async () => {

    const { resolve, whenDone } = new PromiseResolver<void>();
    let sunk: number | undefined;

    const sink: DataSink<number> = async value => {
      sunk = value;
      await whenDone();
    };

    let returned = false;
    const promise = sinkValue(13, sink).then(() => {
      returned = true;
    });

    await new Promise<void>(resolve => setTimeout(resolve, 1));
    expect(sunk).toBe(13);
    expect(returned).toBe(false);

    resolve();
    await expect(promise).resolves.toBeUndefined();
    expect(returned).toBe(true);
  });
  it('resolves when processing supply cut off', async () => {

    const supply = new Supply();
    let sunk: number | undefined;

    const sink: DataSink<number> = value => {
      sunk = value;

      return supply;
    };

    let returned = false;
    const promise = sinkValue(13, sink).then(() => {
      returned = true;
    });

    await new Promise<void>(resolve => setTimeout(resolve, 1));
    expect(sunk).toBe(13);
    expect(returned).toBe(false);

    supply.off();
    await expect(promise).resolves.toBeUndefined();
    expect(returned).toBe(true);
  });
  it('resolves when inflow supply completed', async () => {

    const inflowSupply = new Supply();
    const { resolve, whenDone } = new PromiseResolver<void>();
    let sunk: number | undefined;

    const sink: DataSink<number> = async (value, supply) => {
      await whenDone();
      if (supply.isOff) {
        sunk = -value;
      } else {
        sunk = value;
      }
    };

    const promise = sinkValue(13, sink, inflowSupply);

    await new Promise<void>(resolve => setTimeout(resolve, 1));
    expect(sunk).toBeUndefined();

    inflowSupply.off();
    await expect(promise).resolves.toBeUndefined();
    expect(sunk).toBeUndefined();

    resolve();
    await new Promise<void>(resolve => setTimeout(resolve, 1));
    expect(sunk).toBe(-13);
  });
  it('rejects when inflow supply failed', async () => {

    const inflowSupply = new Supply();
    const { resolve, whenDone } = new PromiseResolver<void>();
    let sunk: number | undefined;

    const sink: DataSink<number> = async (value, supply) => {
      await whenDone();
      if (supply.isOff) {
        sunk = -value;
      } else {
        sunk = value;
      }
    };

    const promise = sinkValue(13, sink, inflowSupply);

    await new Promise<void>(resolve => setTimeout(resolve, 1));
    expect(sunk).toBeUndefined();

    inflowSupply.off('failed');
    await expect(promise).rejects.toBe('failed');
    expect(sunk).toBeUndefined();

    resolve();
    await new Promise<void>(resolve => setTimeout(resolve, 1));
    expect(sunk).toBe(-13);
  });
});

import { describe, expect, it } from '@jest/globals';
import { PromiseResolver } from '@proc7ts/async';
import { Supply } from '@proc7ts/supply';
import { DataSink } from './data-sink.js';
import { sinkValue } from './sink-value.js';

describe('sinkValue', () => {
  it('sinks data synchronously', async () => {
    const { resolve, whenDone } = new PromiseResolver<void>();
    let sank: number | undefined;

    const sink: DataSink<number> = async value => {
      await whenDone();
      sank = value;
    };

    const promise = sinkValue(13, sink);

    await new Promise<void>(resolve => setTimeout(resolve, 1));
    expect(sank).toBeUndefined();

    resolve();
    await expect(promise).resolves.toBeUndefined();
    expect(sank).toBe(13);
  });
  it('resolves when data sank', async () => {
    const { resolve, whenDone } = new PromiseResolver<void>();
    let sank: number | undefined;

    const sink: DataSink<number> = async value => {
      sank = value;
      await whenDone();
    };

    let returned = false;
    const promise = sinkValue(13, sink).then(() => {
      returned = true;
    });

    await new Promise<void>(resolve => setTimeout(resolve, 1));
    expect(sank).toBe(13);
    expect(returned).toBe(false);

    resolve();
    await expect(promise).resolves.toBeUndefined();
    expect(returned).toBe(true);
  });
  it('resolves when processing supply cut off', async () => {
    const supply = new Supply();
    let sank: number | undefined;

    const sink: DataSink<number> = value => {
      sank = value;

      return supply;
    };

    let returned = false;
    const promise = sinkValue(13, sink).then(() => {
      returned = true;
    });

    await new Promise<void>(resolve => setTimeout(resolve, 1));
    expect(sank).toBe(13);
    expect(returned).toBe(false);

    supply.off();
    await expect(promise).resolves.toBeUndefined();
    expect(returned).toBe(true);
  });
  it('resolves when sink supply completed', async () => {
    const sinkSupply = new Supply();
    const { resolve, whenDone } = new PromiseResolver<void>();
    let sank: number | undefined;

    const sink: DataSink<number> = async (value, supply) => {
      await whenDone();
      if (supply.isOff) {
        sank = -value;
      } else {
        sank = value;
      }
    };

    const promise = sinkValue(13, sink, sinkSupply);

    await new Promise<void>(resolve => setTimeout(resolve, 1));
    expect(sank).toBeUndefined();

    sinkSupply.off();
    await expect(promise).resolves.toBeUndefined();
    expect(sank).toBeUndefined();

    resolve();
    await new Promise<void>(resolve => setTimeout(resolve, 1));
    expect(sank).toBe(-13);
  });
  it('rejects when sink supply failed', async () => {
    const sinkSupply = new Supply();
    const { resolve, whenDone } = new PromiseResolver<void>();
    let sank: number | undefined;

    const sink: DataSink<number> = async (value, supply) => {
      await whenDone();
      if (supply.isOff) {
        sank = -value;
      } else {
        sank = value;
      }
    };

    const promise = sinkValue(13, sink, sinkSupply);

    await new Promise<void>(resolve => setTimeout(resolve, 1));
    expect(sank).toBeUndefined();

    sinkSupply.off('failed');
    await expect(promise).rejects.toBe('failed');
    expect(sank).toBeUndefined();

    resolve();
    await new Promise<void>(resolve => setTimeout(resolve, 1));
    expect(sank).toBe(-13);
  });
});

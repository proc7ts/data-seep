import { describe, expect, it } from '@jest/globals';
import { PromiseResolver } from '@proc7ts/async';
import { neverSupply, Supply, SupplyOut } from '@proc7ts/supply';
import { DataSink } from './data-sink.js';
import { withAll } from './with-all.js';
import { withValue } from './with-value.js';

describe('withAll', () => {
  it('seeps empty object without intakes', async () => {
    let sank: unknown;

    await withAll({})((value: unknown) => {
      sank = value;
    });

    expect(sank).toEqual({});
  });
  it('seeps empty object with only undefined intakes', async () => {
    let sank: unknown;

    await withAll({
      some: undefined!,
    })((value: unknown) => {
      sank = value;
    });

    expect(sank).toEqual({});
  });
  it('seeps object with property', async () => {
    let sank: { some: number } | undefined;

    await withAll({
      some: withValue(13),
    })(value => {
      sank = value;
    });

    expect(sank).toEqual({ some: 13 });
  });
  it('seeps object with property multiple times', async () => {
    const valuesSank = new PromiseResolver();
    const sank: { some: number }[] = [];

    await withAll({
      some: async (sink: DataSink<number>) => {
        await Promise.all([sink(1), sink(2), sink(3)]);
      },
    })(async value => {
      sank.push({ ...value });
      if (sank.length === 3) {
        valuesSank.resolve();
      }
      await valuesSank.whenDone();
    });

    expect(sank).toEqual([{ some: 1 }, { some: 2 }, { some: 3 }]);
  });
  it('seeps object with multiple property', async () => {
    let sank: { some: number; other: number } | undefined;

    await withAll({
      some: withValue(13),
      other: withValue(31),
    })(value => {
      sank = value;
    });

    expect(sank).toEqual({ some: 13, other: 31 });
  });
  it('seeps object only when first property is ready', async () => {
    const first = new PromiseResolver<number>();
    let sank: { some: number; other: number } | undefined;

    const promise = withAll({
      some: withValue(first.whenDone()),
      other: withValue(2),
    })(value => {
      sank = value;
    });

    await new Promise<void>(resolve => setTimeout(resolve, 1));
    expect(sank).toBeUndefined();

    first.resolve(1);
    await promise;
    expect(sank).toEqual({ some: 1, other: 2 });
  });
  it('seeps object only when second property is ready', async () => {
    const second = new PromiseResolver<number>();
    let sank: { some: number; other: number } | undefined;

    const promise = withAll({
      some: withValue(1),
      other: withValue(second.whenDone()),
    })(value => {
      sank = value;
    });

    await new Promise<void>(resolve => setTimeout(resolve, 1));
    expect(sank).toBeUndefined();

    second.resolve(2);
    await promise;
    expect(sank).toEqual({ some: 1, other: 2 });
  });
  it('fails on seep failure', async () => {
    let sank: { some: number } | undefined;

    await expect(
      withAll({
        some: async (_sink: DataSink<number>) => Promise.reject('error'),
      })(value => {
        sank = value;
      }),
    ).rejects.toBe('error');

    expect(sank).toBeUndefined();
  });
  it('does not sink value when sink supply cut off', async () => {
    let sank: { some: number } | undefined;

    await withAll({ some: withValue(13) })(value => {
      sank = { ...value };
    }, neverSupply());

    expect(sank).toBeUndefined();
  });
  it('stops sinking when sink supply cut off', async () => {
    const sinkSupply = new Supply();
    const twoValuesSank = new PromiseResolver();
    const valuesSank = new PromiseResolver();
    const sank: { some: number }[] = [];

    await withAll({
      some: async (sink: DataSink<number>, supply: SupplyOut): Promise<void> => {
        let sinkValue = sink;

        supply.whenOff(() => {
          sinkValue = async () => await supply.whenDone();
        });

        const doSink = async (value: number): Promise<void> => {
          await sinkValue(value);
        };

        await Promise.all([doSink(1), doSink(2), twoValuesSank.whenDone().then(() => doSink(3))]);
      },
    })(async value => {
      sank.push({ ...value });
      if (sank.length === 2) {
        twoValuesSank.resolve();
        sinkSupply.done();
      }
      if (sank.length === 3) {
        valuesSank.resolve();
      }
      await Promise.race([
        valuesSank.whenDone(),
        sinkSupply.whenDone().then(() => new Promise(resolve => setTimeout(resolve, 10))),
      ]);
    }, sinkSupply);

    expect(sank).toEqual([{ some: 1 }, { some: 2 }]);
  });
});

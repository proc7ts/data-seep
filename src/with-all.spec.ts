import { describe, expect, it } from '@jest/globals';
import { PromiseResolver } from '@proc7ts/async';
import { DataSink } from './data-sink.js';
import { sinkValue } from './sink-value.js';
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
    const sank: { some: number }[] = [];

    await withAll({
      some: async (sink: DataSink<number>) => {
        await sinkValue(1, sink);
        await sinkValue(2, sink);
        await sinkValue(3, sink);
      },
    })(value => {
      sank.push({ ...value });
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
  it('does nothing on supply cut off', async () => {
    let sank: { some: number } | undefined;

    await expect(
      withAll({
        some: async (_sink: DataSink<number>, supply) => {
          supply.off();

          return Promise.resolve();
        },
      })(value => {
        sank = value;
      }),
    ).resolves.toBeUndefined();

    expect(sank).toBeUndefined();
  });
  it('fails on supply failure', async () => {
    let sank: { some: number } | undefined;

    await expect(
      withAll({
        some: async (_sink: DataSink<number>, supply) => {
          supply.off('error');

          return Promise.resolve();
        },
      })(value => {
        sank = value;
      }),
    ).rejects.toBe('error');

    expect(sank).toBeUndefined();
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
});

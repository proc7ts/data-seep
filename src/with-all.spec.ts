import { describe, expect, it } from '@jest/globals';
import { PromiseResolver } from '@proc7ts/async';
import { DataSink } from './data-sink.js';
import { sinkValue } from './sink-value.js';
import { withAll } from './with-all.js';
import { withValue } from './with-value.js';

describe('withAll', () => {
  it('seeps empty object without sources', async () => {

    let sunk: unknown;

    await withAll({}, (value: unknown) => {
      sunk = value;
    });

    expect(sunk).toEqual({});
  });
  it('seeps empty object with only undefined sources', async () => {

    let sunk: unknown;

    await withAll({ some: undefined! }, (value: unknown) => {
      sunk = value;
    });

    expect(sunk).toEqual({});
  });
  it('seeps object with property', async () => {

    let sunk: { some: number } | undefined;

    await withAll(
        {
          some: async (sink: DataSink<number>) => await withValue(13, sink),
        },
        value => {
          sunk = value;
        },
    );

    expect(sunk).toEqual({ some: 13 });
  });
  it('seeps object with property multiple times', async () => {

    const sunk: { some: number }[] = [];

    await withAll(
        {
          some: async (sink: DataSink<number>) => {
            await sinkValue(1, sink);
            await sinkValue(2, sink);
            await sinkValue(3, sink);
          },
        },
        value => {
          sunk.push({ ...value });
        },
    );

    expect(sunk).toEqual([{ some: 1 }, { some: 2 }, { some: 3 }]);
  });
  it('seeps object with multiple property', async () => {

    let sunk: { some: number; other: number } | undefined;

    await withAll(
        {
          some: async (sink: DataSink<number>) => await withValue(13, sink),
          other: async (sink: DataSink<number>) => await withValue(31, sink),
        },
        value => {
          sunk = value;
        },
    );

    expect(sunk).toEqual({ some: 13, other: 31 });
  });
  it('seeps object only when first property is ready', async () => {

    const first = new PromiseResolver<number>();
    let sunk: { some: number; other: number } | undefined;

    const promise = withAll(
        {
          some: async (sink: DataSink<number>) => await withValue(first.whenDone(), sink),
          other: async (sink: DataSink<number>) => await withValue(2, sink),
        },
        value => {
          sunk = value;
        },
    );

    await new Promise<void>(resolve => setTimeout(resolve, 1));
    expect(sunk).toBeUndefined();

    first.resolve(1);
    await promise;
    expect(sunk).toEqual({ some: 1, other: 2 });
  });
  it('seeps object only when second property is ready', async () => {

    const second = new PromiseResolver<number>();
    let sunk: { some: number; other: number } | undefined;

    const promise = withAll(
        {
          some: async (sink: DataSink<number>) => await withValue(1, sink),
          other: async (sink: DataSink<number>) => await withValue(second.whenDone(), sink),
        },
        value => {
          sunk = value;
        },
    );

    await new Promise<void>(resolve => setTimeout(resolve, 1));
    expect(sunk).toBeUndefined();

    second.resolve(2);
    await promise;
    expect(sunk).toEqual({ some: 1, other: 2 });
  });
  it('provides access to dependencies', async () => {

    let sunk: { some: number; other: number } | undefined;

    await withAll<{ some: number; other: number }>(
        {
          some: async (sink: DataSink<number>) => await withValue(13, sink),
          other: async (
              sink,
              deps,
          ) => await withValue((await deps.get('some')) ** 2, sink),
        },
        value => {
          sunk = value;
        },
    );

    expect(sunk).toEqual({ some: 13, other: 169 });
  });
  it('cancels dependencies acquiring when sunk', async () => {

    let sunk: { some: number; other: number } | undefined;

    await withAll<{ some: number; other: number }>(
        {
          some: async (
              sink,
              deps,
          ) => await withValue((await deps.get('other')) ** 2, sink),
          other: async (
              _sink,
              deps,
          ) => {
            deps.supply.off();

            return Promise.resolve();
          },
        },
        value => {
          sunk = value;
        },
    );

    expect(sunk).toBeUndefined();
  });
  it('cancels dependencies acquiring on error', async () => {

    let sunk: { some: number; other: number } | undefined;

    await expect(withAll<{ some: number; other: number }>(
        {
          some: async (
              sink,
              deps,
          ) => await withValue((await deps.get('other')) ** 2, sink),
          other: async () => Promise.reject('error'),
        },
        value => {
          sunk = value;
        },
    )).rejects.toBe('error');

    expect(sunk).toBeUndefined();
  });
  it('cancels dependencies acquiring on supply failure', async () => {

    let sunk: { some: number; other: number } | undefined;

    await expect(withAll<{ some: number; other: number }>(
        {
          some: async (
              sink,
              deps,
          ) => await withValue((await deps.get('other')) ** 2, sink),
          other: async (_sink, deps) => {
            deps.supply.off('error');

            return Promise.resolve();
          },
        },
        value => {
          sunk = value;
        },
    )).rejects.toBe('error');

    expect(sunk).toBeUndefined();
  });
});

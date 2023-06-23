import { beforeEach, describe, expect, it } from '@jest/globals';
import { PromiseResolver, whenNextEvent } from '@proc7ts/async';
import { Faucet } from '../faucet.js';
import { createFaucet } from './create-faucet.js';

describe('createFaucet', () => {
  let faucet: Faucet<number, [number]>;
  let pending: PromiseResolver<number>[];
  let result: number[];
  let allDone: unknown;

  beforeEach(() => {
    faucet = createFaucet<number, [number]>(async (count, sink) => {
      await Promise.all(new Array(count).fill(0).map(async (_, index) => await sink(index)));
    });
    pending = [];
    result = [];
    allDone = false;

    faucet(3, async index => {
      const resolver = new PromiseResolver<number>();

      pending[index] = resolver;

      await resolver.whenDone().then(value => (result[index] = value));
    })
      .then(() => {
        allDone = true;
      })
      .catch(error => {
        allDone = error;
      });
  });
  it('counts pending data sinks', async () => {
    await whenNextEvent();
    expect(allDone).toBe(false);
    expect(result).toEqual([]);

    pending[0].resolve(10);
    await whenNextEvent();
    expect(allDone).toBe(false);
    expect(result).toEqual([10]);

    pending[2].resolve(12);
    await whenNextEvent();
    expect(allDone).toBe(false);
    expect(result).toEqual([10, undefined, 12]);

    pending[1].resolve(11);
    await whenNextEvent();
    expect(allDone).toBe(true);
    expect(result).toEqual([10, 11, 12]);
  });
  it('fails on rejection', async () => {
    const error = new Error('Test');

    pending[0].resolve(10);
    pending[1].reject(error);
    await whenNextEvent();
    pending[2].resolve(12);

    await whenNextEvent();
    expect(allDone).toBe(error);
    expect(result).toEqual([10, undefined, 12]);
  });
});

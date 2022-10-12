import { describe, expect, it } from '@jest/globals';
import { PromiseResolver } from '@proc7ts/async';
import { noop } from '@proc7ts/primitives';
import { withNone } from './infusions/with-none.js';
import { withValue } from './infusions/with-value.js';
import { sinkAll } from './sink-all.js';

describe('sinkAll', () => {
  it('sinks data while faucet pours it', async () => {
    const inputAvailable = new PromiseResolver<number>();
    const sank: number[] = [];
    let done = false;
    const promise = sinkAll(withValue(inputAvailable.whenDone()), value => {
      sank.push(value);
    });

    promise
      .then(() => {
        done = true;
      })
      .catch(noop);

    await new Promise(resolve => setImmediate(resolve));
    expect(done).toBe(false);

    inputAvailable.resolve(13);
    await new Promise(resolve => setImmediate(resolve));
    expect(sank).toEqual([13]);
    expect(done).toBe(true);
  });
  it('stops pouring when all data sank', async () => {
    const dataSank = new PromiseResolver();
    const sank: number[] = [];
    let done = false;
    const promise = sinkAll(withValue(13), value => {
      sank.push(value);

      return dataSank.whenDone();
    });

    promise
      .then(() => {
        done = true;
      })
      .catch(noop);

    await new Promise(resolve => setImmediate(resolve));
    expect(done).toBe(false);
    expect(sank).toEqual([13]);

    dataSank.resolve();
    await new Promise(resolve => setImmediate(resolve));
    expect(done).toBe(true);
  });
  it('stops pouring immediately if no data to pour', async () => {
    await expect(sinkAll(withNone(), noop)).resolves.toBeUndefined();
  });
});

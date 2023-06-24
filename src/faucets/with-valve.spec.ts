import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { noop } from '@proc7ts/primitives';
import { createFaucet } from './create-faucet.js';
import { ValveClosedError } from './valve-closed.error.js';
import { whenClosed, withValve } from './with-valve.js';

describe('withValve', () => {
  it('stops data pouring immediately', async () => {
    const faucet = createFaucet<number>(async sink => {
      await sink(1);
    });

    let result: number | undefined;

    await expect(
      withValve(async valve => {
        valve.close();

        await faucet(value => {
          result = value;
        });
      }),
    ).resolves.toBeUndefined();

    expect(result).toBeUndefined();
  });
  it('stops already started data pouring', async () => {
    const faucet = createFaucet<number>(async sink => {
      await sink(1);
      await sink(2);
    });

    const results: number[] = [];

    await expect(
      withValve(async valve => {
        await faucet(value => {
          results.push(value);
          valve.close();
        });
      }),
    ).resolves.toBeUndefined();

    expect(results).toEqual([1]);
  });
  it('fails data pouring with cause immediately', async () => {
    const faucet = createFaucet<number>(async sink => {
      await sink(1);
    });

    const error = new Error('Test');
    let result: number | undefined;

    await expect(
      withValve(async valve => {
        valve.close(error);

        await faucet(value => {
          result = value;
        });
      }),
    ).rejects.toEqual(new ValveClosedError(undefined, { cause: error }));

    expect(result).toBeUndefined();
  });
  it('fails already started data pouring', async () => {
    const faucet = createFaucet<number>(async sink => {
      await sink(1);
      await sink(2);
    });

    const error = new Error('Test');
    const results: number[] = [];

    await expect(
      withValve(async valve => {
        await faucet(value => {
          results.push(value);
          valve.close(error);
        });
      }),
    ).rejects.toEqual(new ValveClosedError(undefined, { cause: error }));

    expect(results).toEqual([1]);
  });
  it('fails data pouring with message immediately', async () => {
    const faucet = createFaucet<number>(async sink => {
      await sink(1);
    });

    const error = 'Test';
    let result: number | undefined;

    await expect(
      withValve(async valve => {
        valve.close(error);

        await faucet(value => {
          result = value;
        });
      }),
    ).rejects.toEqual(new ValveClosedError(error));

    expect(result).toBeUndefined();
  });

  describe('callback errors', () => {
    let warnSpy: jest.SpiedFunction<(...args: unknown[]) => void>;

    beforeEach(() => {
      warnSpy = jest.spyOn(console, 'warn');
      warnSpy.mockImplementation(noop);
    });
    afterEach(() => {
      warnSpy.mockRestore();
    });

    it('handled gracefully', async () => {
      let closed = false;
      const callbackError = new Error('Test!');
      const faucet = createFaucet<number>(async sink => {
        whenClosed(() => {
          throw callbackError;
        });
        whenClosed(() => {
          closed = true;
        });
        await sink(1);
        await sink(2);
      });

      const results: number[] = [];

      await expect(
        withValve(async valve => {
          await faucet(value => {
            results.push(value);
            valve.close();
          });
        }),
      ).resolves.toBeUndefined();

      expect(results).toEqual([1]);
      expect(warnSpy).toHaveBeenCalledWith('Error while closing valve:', callbackError);
    });
  });

  describe('nested', () => {
    it('closes nested data pouring', async () => {
      const faucet = createFaucet<number>(async sink => {
        await sink(1);
        await sink(2);
      });

      const error = new Error('Test');
      const results: number[] = [];

      await expect(
        withValve(async valve => {
          await Promise.resolve();
          await valve.withValve(async () => {
            await faucet(value => {
              results.push(value);
              valve.close(error);
            });
          });
        }),
      ).rejects.toEqual(new ValveClosedError(undefined, { cause: error }));

      expect(results).toEqual([1]);
    });
  });
});

import { describe, expect, it } from '@jest/globals';
import { noop } from '@proc7ts/primitives';
import { createDrain } from './create-drain.js';
import { withInflow } from './with-inflow.js';

describe('createDrain', () => {
  it('pours data', async () => {
    const drain = createDrain<number, [number, number]>(
      (from, to) => async sink => {
        for (let i = from; i <= to; ++i) {
          await sink(i);
        }
      },
      false,
    );
    const result: number[] = [];
    const result2: number[] = [];
    const result3: number[] = [];

    await withInflow(async withDrain => {
      await drain(1, 3, async value => {
        result.push(value);

        await withDrain(async () => {
          await drain(value2 => {
            result2.push(value * 10 + value2);
          });
        });
        await withDrain(async () => {
          await drain(value3 => {
            result3.push(value * 100 + value3);
          });
        });
      });
    });

    expect(result).toEqual([1, 2, 3]);
    expect(result2).toEqual([11, 12, 13, 21, 22, 23, 31, 32, 33]);
    expect(result3).toEqual([101, 102, 103, 201, 202, 203, 301, 302, 303]);
  });
  it('pours data in nested inflow', async () => {
    const drain = createDrain<number, [number, number]>(
      (from, to) => async sink => {
        for (let i = from; i <= to; ++i) {
          await sink(i);
        }
      },
      false,
    );
    const result: number[] = [];
    const result2: number[] = [];
    const result3: number[] = [];

    await withInflow(async () => {
      await withInflow(async withDrain => {
        await drain(1, 3, async value => {
          result.push(value);

          await withDrain(async () => {
            await drain(value2 => {
              result2.push(value * 10 + value2);
            });
          });
          await withDrain(async () => {
            await drain(value3 => {
              result3.push(value * 100 + value3);
            });
          });
        });
      });
    });

    expect(result).toEqual([1, 2, 3]);
    expect(result2).toEqual([11, 12, 13, 21, 22, 23, 31, 32, 33]);
    expect(result3).toEqual([101, 102, 103, 201, 202, 203, 301, 302, 303]);
  });
  it('allows to re-drain data', async () => {
    const drain = createDrain<number, [number, number]>(
      (from, to) => async sink => {
        for (let i = from; i <= to; ++i) {
          await sink(i);
        }
      },
      false,
    );
    const result1: number[] = [];
    const result11: number[] = [];
    const result12: number[] = [];
    const result2: number[] = [];
    const result21: number[] = [];
    const result22: number[] = [];
    const result23: number[] = [];

    await withInflow('drain 1', async withDrain1 => {
      await drain(1, 3, async value1 => {
        result1.push(value1);

        await withDrain1(async () => {
          await drain(value11 => {
            result11.push(value1 * 10 + value11);
          });
        });

        await withInflow('drain 2', async withDrain2 => {
          await drain(value1 * 10, value1 * 10 + 1, async value2 => {
            result2.push(value2);

            await withDrain2(async () => {
              await drain(value21 => {
                result21.push(value21);
              });
            });

            await withDrain1(async () => {
              await drain(value22 => {
                result22.push(value2 + value22);
              });
            });

            await withDrain2(async () => {
              await drain(value23 => {
                result23.push(value23);
              });
            });
          });
        });

        await withDrain1(async () => {
          await drain(value12 => {
            result12.push(value1 * 100 + value12);
          });
        });
      });
    });

    expect(result1).toEqual([1, 2, 3]);
    expect(result11).toEqual([11, 12, 13, 21, 22, 23, 31, 32, 33]);
    expect(result12).toEqual([101, 102, 103, 201, 202, 203, 301, 302, 303]);
    expect(result2).toEqual([10, 11, 20, 21, 30, 31]);
    expect(result21).toEqual([10, 11, 10, 11, 20, 21, 20, 21, 30, 31, 30, 31]);
    expect(result22).toEqual([
      11, 12, 13, 12, 13, 14, 21, 22, 23, 22, 23, 24, 31, 32, 33, 32, 33, 34,
    ]);
    expect(result23).toEqual([10, 11, 10, 11, 20, 21, 20, 21, 30, 31, 30, 31]);
  });
  it('fails to pour data without arguments', async () => {
    const drain = createDrain<number, [number, number]>(function withTest(from, to) {
      return async sink => {
        for (let i = from; i <= to; ++i) {
          await sink(i);
        }
      };
    }, false);

    await expect(drain(noop)).rejects.toThrow(TypeError(`Drain withTest not opened yet`));
  });
  it('pours data without arguments', async () => {
    const drain = createDrain<number, [number?, number?]>(function withTest(from = 0, to = 5) {
      return async sink => {
        for (let i = from; i <= to; ++i) {
          await sink(i);
        }
      };
    });
    const results: number[] = [];

    await drain(value => {
      results.push(value);
    });

    expect(results).toEqual([0, 1, 2, 3, 4, 5]);
  });
});

import { PromiseResolver } from '@proc7ts/async';
import { Supply } from '@proc7ts/supply';
import { IntakeFaucet } from '../data-faucet.js';
import { DataSeep } from '../data-seep.js';

/**
 * Creates data seep that converts input values to output faucets by the given converter function, then pours data by
 * each one, sequentially. Pours data from the next output faucet when preceding one completes.
 *
 * @typeParam TIn - Input data type.
 * @typeParam TOut - Output (converted) data type.
 * @param convert - Converter of input value to output faucet.
 *
 * @returns New data seep.
 */
export function concatSeep<TIn, TOut = TIn>(
  convert: (this: void, value: TIn) => IntakeFaucet<TOut>,
): DataSeep<TIn, TOut> {
  return input => async (sink, sinkSupply = new Supply()) => {
      let off = 0;
      let prevCompleted = new PromiseResolver();

      sinkSupply.whenOff(() => {
        off = 1;
        prevCompleted.resolve();
      });

      prevCompleted.resolve();

      await input(async value => {
        const { whenDone } = prevCompleted;
        const completed = (prevCompleted = new PromiseResolver());

        await whenDone();

        if (!off) {
          await convert(value)(sink, sinkSupply);
          completed.resolve();
        }
      }, sinkSupply);

      off = 1;
      prevCompleted.resolve();
    };
}

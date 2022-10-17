import { PromiseResolver } from '@proc7ts/async';
import { Supply } from '@proc7ts/supply';
import { IntakeFaucet } from '../data-faucet.js';
import { DataSeep } from '../data-seep.js';
import { DataSink } from '../data-sink.js';

/**
 * Creates data seep that converts input values to output faucets by the given converter function, and pours data by all
 * output faucets simultaneously.
 *
 * Pours data until sink supply cut off.
 *
 * @typeParam TIn - Input data type.
 * @typeParam TOut - Output (converted) data type.
 * @param convert - Converter of input value to output faucet.
 *
 * @returns New data seep.
 */
export function mergeSeep<TIn, TOut = TIn>(
  convert: (this: void, value: TIn) => IntakeFaucet<TOut>,
): DataSeep<TIn, TOut> {
  return input => async (sink, sinkSupply = new Supply()) => {
      const outSinkSupply = new Supply();

      sink = DataSink(sink, outSinkSupply);

      sinkSupply.alsoOff(outSinkSupply);

      const { resolve, reject, whenDone } = new PromiseResolver();
      let numOuts = 0;
      const addOut = (withOutput: IntakeFaucet<TOut>): void => {
        ++numOuts;

        Promise.resolve()
          .then(async () => {
            await withOutput(sink, outSinkSupply);
            if (!--numOuts) {
              resolve();
            }
          })
          .catch(error => {
            outSinkSupply.fail(error);
            reject(error);
          });
      };

      await input(value => {
        addOut(convert(value));
      }, outSinkSupply);

      if (numOuts) {
        await whenDone();
      }
    };
}

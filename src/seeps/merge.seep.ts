import { PromiseResolver } from '@proc7ts/async';
import { Supply } from '@proc7ts/supply';
import { IntakeFaucet } from '../data-faucet.js';
import { DataSeep } from '../data-seep.js';
import { DataSink } from '../data-sink.js';

/**
 * Creates data seep that converts input values to output faucets by the given `converter`, and data by all output
 * faucets simultaneously.
 *
 * Pours data until sink supply cut off.
 *
 * @typeParam TIn - Input data type.
 * @typeParam TOut - Output (converted) data type.
 * @param convert - Input value to faucet converter function.
 *
 * @returns New data seep.
 */
export function mergeSeep<TIn, TOut = TIn>(
  convert: (value: TIn) => IntakeFaucet<TOut> | PromiseLike<IntakeFaucet<TOut>>,
): DataSeep<TIn, TOut> {
  return input => async (sink, sinkSupply = new Supply()) => {
      const outSinkSupply = new Supply();

      sink = DataSink(sink, outSinkSupply);

      sinkSupply.alsoOff(outSinkSupply);

      const outDone = new PromiseResolver();
      let numOuts = 0;
      const addOut = (out: IntakeFaucet<TOut> | PromiseLike<IntakeFaucet<TOut>>): void => {
        ++numOuts;

        Promise.resolve()
          .then(async () => {
            const withOutput = await out;

            await withOutput(sink, outSinkSupply);
          })
          .then(() => {
            if (!--numOuts) {
              outDone.resolve();
            }
          })
          .catch(error => {
            outSinkSupply.fail(error);
            outDone.reject(error);
          });
      };

      await input(value => {
        addOut(convert(value));
      }, outSinkSupply);

      if (numOuts) {
        await outDone.whenDone();
      }
    };
}

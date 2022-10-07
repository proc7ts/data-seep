import { Supply } from '@proc7ts/supply';
import { IntakeFaucet } from '../data-faucet.js';
import { DataSeep } from '../data-seep.js';

/**
 * Creates data seep that converts input values to data faucets by the given `converter`, then pours data by the most
 * recent one.
 *
 * @typeParam TIn - Input data type.
 * @typeParam TOut - Output (converted) data type.
 * @param convert - Input value to faucet converter function.
 *
 * @returns New data seep.
 */
export function switchSeep<TIn, TOut = TIn>(
  convert: (value: TIn) => IntakeFaucet<TOut> | PromiseLike<IntakeFaucet<TOut>>,
): DataSeep<TIn, TOut> {
  return input => async (sink, sinkSupply = new Supply()) => {
      let outSinkSupply: Supply | undefined;

      await input(async value => {
        const withOutput = await convert(value);

        outSinkSupply?.done();
        outSinkSupply = sinkSupply.derive();

        await withOutput(sink, outSinkSupply);
      }, sinkSupply);
    };
}

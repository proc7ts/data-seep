import { Supply } from '@proc7ts/supply';
import { IntakeFaucet } from '../data-faucet.js';
import { DataSeep } from '../data-seep.js';

/**
 * Creates data seep that converts input values to output faucets by the given converter function, then pours data by
 * the most recent one.
 *
 * @typeParam TIn - Input data type.
 * @typeParam TOut - Output (converted) data type.
 * @param convert - Converter of input value to output faucet.
 *
 * @returns New data seep.
 */
export function switchSeep<TIn, TOut = TIn>(
  convert: (this: void, value: TIn) => IntakeFaucet<TOut>,
): DataSeep<TIn, TOut> {
  return input => async (sink, sinkSupply = new Supply()) => {
      let outSinkSupply: Supply | undefined;

      await input(async value => {
        outSinkSupply?.done();
        outSinkSupply = sinkSupply.derive();

        const withOutput = convert(value);

        await withOutput(sink, outSinkSupply);
      }, sinkSupply);
    };
}

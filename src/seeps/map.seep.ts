import { Supply } from '@proc7ts/supply';
import { DataSeep } from '../data-seep.js';

/**
 * Creates data seep that converts data values originated from input faucet by the given `converter`.
 *
 * @typeParam TIn - Input data type.
 * @typeParam TOut - Output (converted) data type.
 * @param convert - Data values converter function.
 *
 * @returns New data seep.
 */
export function mapSeep<TIn, TOut = TIn>(
  convert: (input: TIn) => TOut | PromiseLike<TOut>,
): DataSeep<TIn, TOut> {
  return input => async (sink, sinkSupply = new Supply()) => {
      await input(async value => await sink(await convert(value)), sinkSupply);
    };
}

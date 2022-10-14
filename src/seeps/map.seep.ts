import { Supply } from '@proc7ts/supply';
import { DataSeep } from '../data-seep.js';

/**
 * Creates data seep that pours values converted from input ones by the given `converter`.
 *
 * @typeParam TIn - Input data type.
 * @typeParam TOut - Output (converted) data type.
 * @param convert - Input value converter function.
 *
 * @returns New data seep.
 */
export function mapSeep<TIn, TOut = TIn>(
  convert: (this: void, input: TIn) => TOut,
): DataSeep<TIn, TOut> {
  return input => async (sink, sinkSupply = new Supply()) => {
      await input(async value => await sink(convert(value)), sinkSupply);
    };
}

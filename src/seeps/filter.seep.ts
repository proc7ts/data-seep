import { Supply } from '@proc7ts/supply';
import { DataSeep } from '../data-seep.js';

/**
 * Creates data seep that pours input values satisfying the given `predicate`.
 *
 * @typeParam T - Poured data type.
 * @param predicate - Predicate the output values should satisfy.
 *
 * @returns New data seep.
 */
export function filterSeep<T>(predicate: (this: void, value: T) => boolean): DataSeep<T> {
  return input => async (sink, sinkSupply = new Supply()) => {
      await input(async value => {
        if (predicate(value)) {
          await sink(value);
        }
      }, sinkSupply);
    };
}

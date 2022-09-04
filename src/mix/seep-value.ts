import { withValue } from '../with-value.js';
import { DataSeep } from './data-seep.js';

/**
 * Creates a data seep infusing single `value`.
 *
 * @typeParam T - Infused data type.
 * @typeParam TOptions - Tuple type representing infusion options.
 * @param value - Value to infuse.
 *
 * @returns Data value seep.
 */
export function seepValue<T, TOptions extends unknown[]>(value: T): DataSeep<T, TOptions> {
  const faucet = withValue(value);

  return () => faucet;
}

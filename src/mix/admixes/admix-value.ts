import { withValue } from '../../infusions/with-value.js';
import { DataAdmix } from '../data-admix.js';

/**
 * Creates admix of single `value`.
 *
 * @typeParam T - Infused data type.
 * @typeParam TOptions - Tuple type representing infusion options.
 * @param value - Value to infuse.
 *
 * @returns Data value admix.
 */
export function admixValue<T, TOptions extends unknown[]>(value: T): DataAdmix<T, TOptions> {
  const faucet = withValue(value);

  return { pour: () => faucet };
}

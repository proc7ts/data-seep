import { DataInfusion } from '../data-infusion.js';
import { withValue } from '../with-value.js';
import { DataAdmix } from './data-admix.js';

/**
 * Creates a data admix infusing single `value`.
 *
 * @typeParam T - Infused data type.
 * @typeParam TOptions - Tuple type representing infusion options.
 * @param infuse - Source data infusion.
 * @param value - Value to infuse.
 *
 * @returns Data value admix.
 */
export function admixValue<T, TOptions extends unknown[]>(
  infuse: DataInfusion<T, TOptions>,
  value: T,
): DataAdmix<T, TOptions> {
  const faucet = withValue(value);

  return { infuse, pour: () => faucet };
}

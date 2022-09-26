import { DataInfusion } from '../../data-infusion.js';
import { DataAdmix } from '../data-admix.js';

/**
 * Creates a data admix that infuses data by faucet with the given `options`.
 *
 * @typeParam T - Infused data type.
 * @typeParam TOptions - Tuple type representing infusion options.
 * @param infuse - Source data infusion.
 * @param options - Custom infusion options.
 *
 * @returns New data admix.
 */
export function admix<T, TOptions extends unknown[]>(
  infuse: DataInfusion<T, TOptions>,
  ...options: TOptions
): DataAdmix<T, TOptions> {
  return {
    infuse,
    pour: () => infuse(...options),
  };
}

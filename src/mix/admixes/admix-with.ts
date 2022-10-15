import { DataAdmix } from '../data-admix.js';

/**
 * Creates a data admix that infuses data by faucet with the given `options`.
 *
 * @typeParam T - Infused data type.
 * @typeParam TOptions - Tuple type representing infusion options.
 * @param options - Custom infusion options.
 *
 * @returns New data admix.
 */
export function admixWith<T, TOptions extends unknown[]>(
  ...options: TOptions
): DataAdmix<T, TOptions> {
  return {
    pour: ({ infuse }) => infuse(...options),
  };
}

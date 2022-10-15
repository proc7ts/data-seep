import { DataAdmix } from '../data-admix.js';
import { DataMix } from '../data-mix.js';
import { ArrayAdmix } from './array-admix.impl.js';

/**
 * Creates admix of array-valued infusion.
 *
 * Infused arrays concatenated, so multiple such admixes may be added to the mix.
 *
 * @typeParam T - Infused array element type.
 * @typeParam TOptions - Tuple type representing infusion options.
 * @param admix - Admix of array to infuse.
 *
 * @returns Array admix.
 */
export function admixArray<
  T,
  TOptions extends unknown[] = unknown[],
  TMix extends DataMix = DataMix,
>(admix: DataAdmix<T[], TOptions, TMix>): DataAdmix<T[], TOptions, TMix> {
  return new ArrayAdmix(admix);
}

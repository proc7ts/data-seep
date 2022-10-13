import { DataAdmix } from '../data-admix.js';
import { DataMix } from '../data-mix.js';
import { ArrayAdmix } from './array-admix.impl.js';

export function admixArray<
  T,
  TOptions extends unknown[] = unknown[],
  TMix extends DataMix = DataMix,
>(admix: DataAdmix<T[], TOptions, TMix>): DataAdmix<T[], TOptions, TMix> {
  return new ArrayAdmix(admix);
}

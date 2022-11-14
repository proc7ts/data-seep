import { DataFaucet } from '../../data-faucet.js';
import { DataInfusion } from '../../data-infusion.js';
import { DataAdmix } from '../data-admix.js';
import { DataMix } from '../data-mix.js';
import { DataAdmix$Store } from './data-admix.store.js';

/**
 * @internal
 */
export class DataMix$Compound<TMix extends DataMix> implements DataMix.Compound {

  readonly #mix: TMix;
  readonly #admixes: DataAdmix$Store<TMix>;

  constructor(mix: TMix, admixes: DataAdmix$Store<TMix>) {
    this.#mix = mix;
    this.#admixes = admixes;
  }

  watch<T, TOptions extends unknown[]>(
    infuse: DataInfusion<T, TOptions>,
  ): DataFaucet<DataAdmix.Update<T, TOptions>> {
    return this.#admixes.slotFor(infuse).watch(this.#mix);
  }

}

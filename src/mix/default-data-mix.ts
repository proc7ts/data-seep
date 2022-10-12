import { DataFaucet } from '../data-faucet.js';
import { DataInfusion } from '../data-infusion.js';
import { DataAdmix } from './data-admix.js';
import { DataMixCompound } from './data-mix-compound.js';
import { DataMix } from './data-mix.js';

/**
 * Default data mix implementation.
 *
 * Used when no {@link DataMixCompounder data compounder} provided for {@link DataMixer data mixer}.
 */
export class DefaultDataMix extends DataMix {

  readonly #compound: DataMixCompound;

  /**
   * Constructs data mix.
   *
   * @param createCompound - Mixed data compound factory function, accepting a data mix instance as its only parameter.
   */
  constructor(createCompound: (mix: DataMix) => DataMixCompound) {
    super();
    this.#compound = createCompound(this);
  }

  override watch<T, TOptions extends unknown[]>(
    infusion: DataInfusion<T, TOptions>,
  ): DataFaucet<DataAdmix.Update<T, TOptions>> {
    return this.#compound.watch(infusion);
  }

}

import { DataFaucet } from '../data-faucet.js';
import { DataInfusion } from '../data-infusion.js';
import { DataCompound } from './data-compound.js';
import { DataMix } from './data-mix.js';

/**
 * Default data mix implementation.
 *
 * Used when no {@link DataCompounder data compounder} provided for {@link DataMixer data mixer}.
 */
export class DefaultDataMix extends DataMix {

  readonly #compound: DataCompound;

  /**
   * Constructs data mix.
   *
   * @param compound - Mixed data compound.
   */
  constructor(compound: DataCompound) {
    super();
    this.#compound = compound;
  }

  override pour<T, TOptions extends []>(infusion: DataInfusion<T, TOptions>): DataFaucet<T> {
    return this.#compound.faucetFor(infusion, this);
  }

}

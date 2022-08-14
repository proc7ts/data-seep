import { DataFaucet } from '../data-faucet.js';
import { DataInfusion } from '../data-infusion.js';
import { DataCompound } from './data-compound.js';
import { DataMix } from './data-mix.js';

export class DefaultDataMix extends DataMix {

  readonly #compound: DataCompound;

  constructor(compound: DataCompound) {
    super();
    this.#compound = compound;
  }

  flow<T, TOptions extends []>(infusion: DataInfusion<T, TOptions>): DataFaucet<T> {
    return this.#compound.faucetFor(infusion, this);
  }

}

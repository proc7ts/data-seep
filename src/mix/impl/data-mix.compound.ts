import { DataFaucet } from '../../data-faucet.js';
import { DataInfusion } from '../../data-infusion.js';
import { DataAdmix } from '../data-admix.js';
import { DataMix } from '../data-mix.js';
import { DataMixer$Admixes } from './data-mixer.admixes.js';

/**
 * @internal
 */
export class DataMix$Compound<TMix extends DataMix> implements DataMix.Compound {

  readonly #mix: TMix;
  readonly #admixes: DataMixer$Admixes<TMix>;

  constructor(mix: TMix, admixes: DataMixer$Admixes<TMix>) {
    this.#mix = mix;
    this.#admixes = admixes;
  }

  watch<T, TOptions extends unknown[]>(
    infuse: DataInfusion<T, TOptions>,
  ): DataFaucet<DataAdmix.Update<T, TOptions>> {
    const entryJoint = this.#admixes.joint(infuse);

    return async (sink, sinkSupply) => await entryJoint.faucet(async entry => {
        if (entry.pour) {
          await sink({ infuse, supply: entry.admixSupply, faucet: entry.pour(this.#mix) });
        } else {
          await sink({ infuse, supply: entry.admixSupply });
        }
      }, sinkSupply);
  }

}

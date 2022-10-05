import { Supply } from '@proc7ts/supply';
import { IntakeFaucet } from '../../data-faucet.js';
import { DataInfusion } from '../../data-infusion.js';
import { DataAdmix } from '../data-admix.js';
import { DataMix } from '../data-mix.js';
import { SingleAdmix } from '../single.admix.js';

/**
 * @internal
 */
export class SingleAdmix$Blend<T, TOptions extends unknown[], TMix extends DataMix>
  implements DataAdmix.Blend<T, TOptions, TMix> {

  readonly #infuse: DataInfusion<T, TOptions>;
  readonly #admix: SingleAdmix<T, TOptions, TMix>;
  readonly #supply: Supply;

  constructor(
    infuse: DataInfusion<T, TOptions>,
    admix: SingleAdmix<T, TOptions, TMix>,
    supply: Supply,
  ) {
    this.#infuse = infuse;
    this.#admix = admix;
    this.#supply = supply;
  }

  get supply(): Supply {
    return this.#supply;
  }

  pour(mix: TMix): IntakeFaucet<T> {
    return this.#admix.pour({ infuse: this.#infuse, mix, supply: this.#supply });
  }

}

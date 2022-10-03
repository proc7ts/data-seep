import { Supply } from '@proc7ts/supply';
import { IntakeFaucet } from '../../data-faucet.js';
import { DataAdmix } from '../data-admix.js';
import { DataMix } from '../data-mix.js';
import { DataMixer } from '../data-mixer.js';
import { SingleAdmix } from '../single.admix.js';

/**
 * @internal
 */
export interface DataAdmix$Removed {
  readonly supply: Supply;
  readonly pour?: undefined;
  readonly extend?: undefined;
}

/**
 * @internal
 */
export class DataAdmix$Entry<out T, in TOptions extends unknown[], in out TMix extends DataMix> {

  static create<T, TOptions extends unknown[], TMix extends DataMix>(
    mixer: DataMixer<TMix>,
    admix: DataAdmix<T, TOptions, TMix>,
  ): DataAdmix$Entry<T, TOptions, TMix> | undefined {
    const { supply = new Supply() } = admix;

    if (supply.isOff) {
      return;
    }

    return new DataAdmix$Entry(admix, this.#createBlend(mixer, admix, supply), supply);
  }

  static #createBlend<T, TOptions extends unknown[], TMix extends DataMix>(
    mixer: DataMixer<TMix>,
    admix: DataAdmix<T, TOptions, TMix>,
    supply: Supply,
  ): DataAdmix.Blend<T, TOptions, TMix> {
    if (admix.blend) {
      return admix.blend({
        mixer,
        supply,
      });
    }

    return new SingleAdmix$Blend(admix);
  }

  readonly #admix: DataAdmix<T, TOptions, TMix>;
  readonly #blend: DataAdmix.Blend<T, TOptions, TMix>;
  readonly #supply: Supply;

  private constructor(
    admix: DataAdmix<T, TOptions, TMix>,
    blend: DataAdmix.Blend<T, TOptions, TMix>,
    supply: Supply,
  ) {
    this.#admix = admix;
    this.#blend = blend;
    this.#supply = supply;
  }

  get admix(): DataAdmix<T, TOptions, TMix> {
    return this.#admix;
  }

  get blend(): DataAdmix.Blend<T, TOptions, TMix> {
    return this.#blend;
  }

  get supply(): Supply {
    return this.#supply;
  }

  pour(mix: TMix): IntakeFaucet<T> {
    const faucet = this.blend.pour(mix);

    return (sink, sinkSupply) => faucet(sink, this.supply.derive().needs(sinkSupply));
  }

  extend(
    mixer: DataMixer<TMix>,
    admix: DataAdmix<T, TOptions, TMix>,
  ): DataAdmix$Entry<T, TOptions, TMix> | undefined {
    const { supply = new Supply() } = admix;
    let blend: DataAdmix.Blend<T, TOptions, TMix>;

    if (admix.replace) {
      if (supply.isOff) {
        this.supply.done();

        return;
      }

      blend = admix.replace({
        mixer,
        supply,
        replaced: {
          admix: this.admix,
          blend: this.blend,
          supply: this.supply,
        },
      });
    } else if (this.blend.extend) {
      blend = this.blend.extend(admix);

      if (supply.isOff && this.supply.isOff) {
        return;
      }
    } else {
      this.supply.done();

      if (supply.isOff) {
        return;
      }

      blend = DataAdmix$Entry.#createBlend(mixer, admix, supply);
    }

    return new DataAdmix$Entry(admix, blend, supply);
  }

}

class SingleAdmix$Blend<out T, in TOptions extends unknown[], out TMix extends DataMix>
  implements DataAdmix.Blend<T, TOptions, TMix> {

  readonly #admix: SingleAdmix<T, TOptions, TMix>;

  constructor(admix: SingleAdmix<T, TOptions, TMix>) {
    this.#admix = admix;
  }

  pour(mix: TMix): IntakeFaucet<T> {
    return this.#admix.pour(mix);
  }

}

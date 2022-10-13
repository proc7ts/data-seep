import { Supply } from '@proc7ts/supply';
import { IntakeFaucet } from '../../data-faucet.js';
import { DataInfusion } from '../../data-infusion.js';
import { DataAdmix } from '../data-admix.js';
import { DataMix } from '../data-mix.js';
import { DataMixer } from '../data-mixer.js';
import { SingleAdmix$Blend } from './single-admix.blend.js';

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
export class DataAdmix$Entry<T, TOptions extends unknown[], TMix extends DataMix> {

  static create<T, TOptions extends unknown[], TMix extends DataMix>(
    mixer: DataMixer<TMix>,
    infuse: DataInfusion<T, TOptions>,
    admix: DataAdmix<T, TOptions, TMix>,
  ): DataAdmix$Entry<T, TOptions, TMix> | undefined {
    const { supply = new Supply() } = admix;

    if (supply.isOff) {
      return;
    }

    return new DataAdmix$Entry(admix, this.#createBlend(mixer, infuse, admix, supply), supply);
  }

  static #createBlend<T, TOptions extends unknown[], TMix extends DataMix>(
    mixer: DataMixer<TMix>,
    infuse: DataInfusion<T, TOptions>,
    admix: DataAdmix<T, TOptions, TMix>,
    supply: Supply,
  ): DataAdmix.Blend<T, TOptions, TMix> {
    if (admix.blend) {
      return admix.blend({
        mixer,
        infuse,
        supply,
      });
    }

    return new SingleAdmix$Blend(infuse, admix, supply);
  }

  #admix: DataAdmix<T, TOptions, TMix>;
  #blend: DataAdmix.Blend<T, TOptions, TMix>;
  #supply: Supply;
  #prev: DataAdmix$Entry<T, TOptions, TMix> | undefined;
  #next: DataAdmix$Entry<T, TOptions, TMix> | undefined;

  private constructor(
    admix: DataAdmix<T, TOptions, TMix>,
    blend: DataAdmix.Blend<T, TOptions, TMix>,
    supply: Supply,
  ) {
    this.#admix = admix;
    this.#blend = blend;
    this.#supply = supply;
  }

  get supply(): Supply {
    return this.#supply;
  }

  get admix(): DataAdmix<T, TOptions, TMix> {
    return this.#admix;
  }

  get blend(): DataAdmix.Blend<T, TOptions, TMix> {
    return this.#blend;
  }

  pour(mix: TMix): IntakeFaucet<T> {
    const faucet = this.blend.pour(mix);

    return async (sink, sinkSupply) => await faucet(sink, this.supply.derive().needs(sinkSupply));
  }

  extend(
    mixer: DataMixer<TMix>,
    infuse: DataInfusion<T, TOptions>,
    admix: DataAdmix<T, TOptions, TMix>,
  ): DataAdmix$Entry<T, TOptions, TMix> | undefined {
    const { supply = new Supply() } = admix;
    let blend: DataAdmix.Blend<T, TOptions, TMix>;

    if (admix.replace) {
      if (supply.isOff) {
        this.#supply.done();

        return;
      }

      blend = admix.replace({
        mixer,
        infuse,
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

      blend = DataAdmix$Entry.#createBlend(mixer, infuse, admix, supply);
    }

    return this.#replace(admix, blend, supply);
  }

  #replace(
    admix: DataAdmix<T, TOptions, TMix>,
    blend: DataAdmix.Blend<T, TOptions, TMix>,
    supply: Supply,
  ): DataAdmix$Entry<T, TOptions, TMix> {
    const next = new DataAdmix$Entry<T, TOptions, TMix>(admix, blend, supply);

    this.#blend = null!; // Unusable from now on.
    this.#next = next;
    next.#prev = this;

    return next;
  }

  drop(): DataAdmix$Entry<T, TOptions, TMix> | DataAdmix$Removed | void {
    const prev = this.#prev;
    const next = this.#next;

    if (!next) {
      // Most recent entry.
      if (!prev) {
        // No more entries left.

        return { supply: this.supply }; // Drop infusion entry.
      }

      // Pop previous admix.
      this.#admix = prev.admix;
      this.#supply = prev.supply;

      // Remove previous entry, as it no longer needed.
      prev.#remove();

      return this; // Infusion entry remains the same, but with previous admix.
    }

    // Not a top-level entry.
    // Just remove it from the list.
    this.#remove();
  }

  #remove(): void {
    const prev = this.#prev;
    const next = this.#next;

    if (next) {
      next.#prev = prev;
    }
    if (prev) {
      prev.#next = next;
    }

    this.#prev = this.#next = undefined;

    return;
  }

}

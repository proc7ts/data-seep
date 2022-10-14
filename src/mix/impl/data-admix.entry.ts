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
  readonly admixSupply: Supply;
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

    return new DataAdmix$Entry(
      admix,
      supply,
      this.#createBlendFactory(mixer, infuse, admix, supply),
    );
  }

  static #createBlendFactory<T, TOptions extends unknown[], TMix extends DataMix>(
    mixer: DataMixer<TMix>,
    infuse: DataInfusion<T, TOptions>,
    admix: DataAdmix<T, TOptions, TMix>,
    admixSupply: Supply,
  ): () => DataAdmix.Blend<T, TOptions, TMix> {
    if (admix.blend) {
      return () => admix.blend({
          mixer,
          infuse,
          supply: admixSupply,
        });
    }

    return () => new SingleAdmix$Blend(infuse, admix, admixSupply);
  }

  #admix: DataAdmix<T, TOptions, TMix>;
  #admixSupply: Supply;
  #blendFactory: () => DataAdmix.Blend<T, TOptions, TMix>;
  #blend?: DataAdmix.Blend<T, TOptions, TMix>;

  #prev: DataAdmix$Entry<T, TOptions, TMix> | undefined;
  #next: DataAdmix$Entry<T, TOptions, TMix> | undefined;

  private constructor(
    admix: DataAdmix<T, TOptions, TMix>,
    admixSupply: Supply,
    blendFactory: () => DataAdmix.Blend<T, TOptions, TMix>,
  ) {
    this.#admix = admix;
    this.#admixSupply = admixSupply;
    this.#blendFactory = blendFactory;
  }

  get admix(): DataAdmix<T, TOptions, TMix> {
    return this.#admix;
  }

  get admixSupply(): Supply {
    return this.#admixSupply;
  }

  get blend(): DataAdmix.Blend<T, TOptions, TMix> {
    // Delay blend construction.
    // This makes it possible to reuse existing blend, but modify it only after the entry replacement.
    return (this.#blend ||= this.#blendFactory());
  }

  pour(mix: TMix): IntakeFaucet<T> {
    const faucet = this.blend.pour(mix);

    return async (sink, sinkSupply) => {
      await faucet(async value => {
        await sink(value);
      }, this.admixSupply.derive().needs(sinkSupply));
    };
  }

  extend(
    mixer: DataMixer<TMix>,
    infuse: DataInfusion<T, TOptions>,
    admix: DataAdmix<T, TOptions, TMix>,
  ): DataAdmix$Entry<T, TOptions, TMix> | undefined {
    const { supply = new Supply() } = admix;
    const { blend } = this;
    let blendFactory: () => DataAdmix.Blend<T, TOptions, TMix>;

    if (admix.replace) {
      if (supply.isOff) {
        this.#admixSupply.done();

        return;
      }

      blendFactory = () => admix.replace!({
          mixer,
          infuse,
          supply,
          replaced: {
            admix: this.admix,
            blend: blend,
            supply: this.admixSupply,
          },
        });
    } else if (blend.extend) {
      if (supply.isOff && this.admixSupply.isOff) {
        return;
      }

      blendFactory = () => blend.extend!(admix);
    } else {
      this.admixSupply.done();

      if (supply.isOff) {
        return;
      }

      blendFactory = DataAdmix$Entry.#createBlendFactory(mixer, infuse, admix, supply);
    }

    return this.#replace(admix, supply, blendFactory);
  }

  #replace(
    admix: DataAdmix<T, TOptions, TMix>,
    admixSupply: Supply,
    blendFactory: () => DataAdmix.Blend<T, TOptions, TMix>,
  ): DataAdmix$Entry<T, TOptions, TMix> {
    const next = new DataAdmix$Entry<T, TOptions, TMix>(admix, admixSupply, blendFactory);

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

        return { admixSupply: this.admixSupply }; // Drop infusion entry.
      }

      // Pop previous admix.
      this.#admix = prev.admix;
      this.#admixSupply = prev.admixSupply;

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

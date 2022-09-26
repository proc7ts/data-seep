import { Supply } from '@proc7ts/supply';
import { DataFaucet, IntakeFaucet } from '../data-faucet.js';
import { DataInfusion } from '../data-infusion.js';
import { DataSink } from '../data-sink.js';
import { withValue } from '../with-value.js';
import { DataAdmix } from './data-admix.js';
import { DataInfusionError } from './data-infusion.error.js';
import { DataMixCompound, DataMixCompounder } from './data-mix-compound.js';
import { DataMix } from './data-mix.js';
import { DefaultDataMix } from './default-data-mix.js';

/**
 * Data mixer allows to mix data originated from different {@link DataInfusion infusions},
 *
 * The resulting {@link DataMix data mix} may be used to pour the infused data.
 *
 * @typeParam TMix - Type of resulting data mix.
 */
export class DataMixer<TMix extends DataMix = DataMix> {

  readonly #compounder: DataMixCompounder<TMix>;
  readonly #admixes = new Map<
    DataInfusion<unknown, unknown[]>,
    DataAdmixEntry<unknown, unknown[], TMix>
  >();

  /**
   * Constructs data mixer.
   *
   * @param init - Initialization tuple containing mixed data compounder. The one puring {@link DefaultDataMix} will be
   * used when omitted.
   */
  constructor(
    ...init: DataMix extends TMix
      ? [compounder?: DataMixCompounder<TMix>]
      : [compounder: DataMixCompounder<TMix>]
  );

  constructor(compounder: DataMixCompounder<TMix> = DataMix$createDefault) {
    this.#compounder = compounder;
  }

  /**
   * Adds the given `admix` to {@link mix target data mix}.
   *
   * Replaces previously added admix.
   *
   * @typeParam T - Infused data type. I.e. the type of data poured by created faucet.
   * @typeParam TOptions - Tuple type representing infusion options.
   * @param admix - Data admix to add.
   *
   * @returns Admix supply. Once cut off, the `admix` will be removed from the mix and thus won't pour any data.
   */
  add<T, TOptions extends unknown[]>(admix: DataAdmix<T, TOptions, TMix>): Supply {
    const infusion = admix.infuse as DataInfusion<unknown, unknown[]>;
    const prevAdmix = this.#admixes.get(infusion);

    prevAdmix?.supply.done();

    const entry = new DataAdmixEntry(admix);
    const { supply } = entry;

    if (supply.isOff) {
      return supply;
    }

    this.#admixes.set(infusion, entry as DataAdmixEntry<unknown, unknown[], TMix>);

    supply.whenOff(() => {
      this.#admixes.delete(infusion);
    });

    return supply;
  }

  /**
   * Mixes infused data and purs the result data mix to the given `sink`.
   *
   * @param sink - Target sink of data mix.
   * @param sinkSupply - Optional data mix `sink` supply. When cut off the mix should not be poured to target `sink`.
   *
   * @returns Promise resolved when the mix poured and sank.
   */
  async mix(sink: DataSink<TMix>, sinkSupply: Supply = new Supply()): Promise<void> {
    const compound = new DataMix$Compound(this.#admixes);
    const mixFaucet = this.#compounder(compound);

    await mixFaucet(sink, sinkSupply);
  }

}

class DataMix$Compound<TMix extends DataMix> implements DataMixCompound<TMix> {

  readonly #admixes = new Map<
    DataInfusion<unknown, unknown[]>,
    DataAdmixEntry<unknown, unknown[], TMix>
  >();

  readonly #faucets = new Map<DataInfusion<unknown, unknown[]>, DataFaucet<unknown>>();

  constructor(
    seeps: Map<DataInfusion<unknown, unknown[]>, DataAdmixEntry<unknown, unknown[], TMix>>,
  ) {
    this.#admixes = seeps;
  }

  pour<T, TOptions extends []>(infusion: DataInfusion<T, TOptions>, mix: TMix): DataFaucet<T> {
    let faucet = this.#faucets.get(infusion as DataInfusion<unknown, unknown[]>) as
      | DataFaucet<T>
      | undefined;

    if (!faucet) {
      const admix = this.#admixes.get(
        infusion as DataInfusion<unknown, unknown[]>,
      ) as DataAdmixEntry<T, TOptions, TMix>;

      if (admix) {
        const admixFaucet = admix.pour(mix);

        faucet = async (sink, sinkSpply = new Supply()) => {
          await admixFaucet(sink, sinkSpply);
        };
      } else {
        faucet = () => Promise.reject(
            new DataInfusionError(undefined, {
              infusion: infusion as DataInfusion<unknown, unknown[]>,
            }),
          );
      }
    }

    return faucet;
  }

}

function DataMix$createDefault<TMix extends DataMix>(
  compound: DataMixCompound<TMix>,
): DataFaucet<TMix> {
  return withValue(new DefaultDataMix(compound) as DataMix as TMix);
}

class DataAdmixEntry<T, TOptions extends unknown[], TMix extends DataMix> {

  readonly #admix: DataAdmix<T, TOptions, TMix>;
  readonly #supply: Supply;

  constructor(admix: DataAdmix<T, TOptions, TMix>) {
    const { supply = new Supply() } = admix;

    this.#admix = admix;
    this.#supply = supply;
  }

  get admix(): DataAdmix<T, TOptions, TMix> {
    return this.#admix;
  }

  get supply(): Supply {
    return this.#supply;
  }

  pour(mix: TMix): IntakeFaucet<T> {
    const faucet = this.admix.pour(mix);

    return (sink, sinkSupply) => faucet(sink, this.supply.derive().needs(sinkSupply));
  }

}

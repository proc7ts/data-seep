import { Supply } from '@proc7ts/supply';
import { DataFaucet } from '../data-faucet.js';
import { DataInfusion } from '../data-infusion.js';
import { DataSink } from '../data-sink.js';
import { sinkValue } from '../sink-value.js';
import { DataCompound, DataCompounder } from './data-compound.js';
import { DataInfusionError } from './data-infusion.error.js';
import { DataMix } from './data-mix.js';
import { DataSeep } from './data-seep.js';
import { DefaultDataMix } from './default-data-mix.js';

/**
 * Data mixer allows to mix data originated from different {@link DataInfusion infusions},
 *
 * The resulting {@link DataMix data mix} may be used to pour the infused data.
 *
 * @typeParam TMix - Type of resulting data mix.
 */
export class DataMixer<TMix extends DataMix = DataMix> {

  readonly #compounder: DataCompounder<TMix>;
  readonly #seeps = new Map<DataInfusion<unknown, unknown[]>, DataSeep<unknown, unknown[], TMix>>();

  /**
   * Constructs data mixer.
   *
   * @param init - Initialization tuple containing mized data compounder. The one puring {@link DefaultDataMix} will be
   * used when omitted.
   */
  constructor(
    ...init: DataMix extends TMix
      ? [compounder?: DataCompounder<TMix>]
      : [compounder: DataCompounder<TMix>]
  );

  constructor(compounder: DataCompounder<TMix> = DataMix$createDefault) {
    this.#compounder = compounder;
  }

  /**
   * Infuses the mix with the given data `infusion`.
   *
   * The infused data will be available in the {@link mix resulting data mix}.
   *
   * @typeParam T - Infused data type. I.e. the type of data poured by created faucet.
   * @typeParam TOptions - Tuple type representing infusion options.
   * @param infusion - Source data infusion.
   * @param seep - Source data seep.
   *
   * @returns `this` instance.
   */
  infuse<T, TOptions extends unknown[]>(
    infusion: DataInfusion<T, TOptions>,
    seep: DataSeep<T, TOptions, TMix>,
  ): this {
    this.#seeps.set(
      infusion as DataInfusion<unknown, unknown[]>,
      seep as DataSeep<unknown, unknown[], TMix>,
    );

    return this;
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
    const compound = new DataMix$Compound(this.#seeps, sinkSupply);

    try {
      const mixFaucet = this.#compounder(compound);

      await mixFaucet(sink, sinkSupply);
    } finally {
      compound.supply.off();
    }
  }

}

class DataMix$Compound<TMix extends DataMix> implements DataCompound<TMix> {

  readonly #seeps = new Map<DataInfusion<unknown, unknown[]>, DataSeep<unknown, unknown[], TMix>>();
  readonly #supply: Supply;
  readonly #faucets = new Map<DataInfusion<unknown, unknown[]>, DataFaucet<unknown>>();

  constructor(
    seeps: Map<DataInfusion<unknown, unknown[]>, DataSeep<unknown, unknown[], TMix>>,
    supply: Supply,
  ) {
    this.#seeps = seeps;
    this.#supply = supply;
  }

  get supply(): Supply {
    return this.#supply;
  }

  faucetFor<T, TOptions extends []>(infusion: DataInfusion<T, TOptions>, mix: TMix): DataFaucet<T> {
    let faucet = this.#faucets.get(infusion as DataInfusion<unknown, unknown[]>) as
      | DataFaucet<T>
      | undefined;

    if (!faucet) {
      const seep = this.#seeps.get(infusion as DataInfusion<unknown, unknown[]>) as DataSeep<
        T,
        TOptions,
        TMix
      >;

      if (seep) {
        const seepFaucet = seep(infusion, mix);

        faucet = async (sink, sinkSpply = new Supply()) => {
          await seepFaucet(sink, sinkSpply.needs(this.#supply));
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
  compound: DataCompound<TMix>,
): DataFaucet<TMix> {
  return async (sink, supply) => await sinkValue(new DefaultDataMix(compound) as DataMix as TMix, sink, supply);
}
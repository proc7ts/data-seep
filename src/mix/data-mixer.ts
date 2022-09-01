import { Supply } from '@proc7ts/supply';
import { DataFaucet } from '../data-faucet.js';
import { DataInfusion } from '../data-infusion.js';
import { DataSink } from '../data-sink.js';
import { sinkValue } from '../sink-value.js';
import { DataCompound, DataCompounder } from './data-compound.js';
import { DataMix } from './data-mix.js';
import { DataSeep } from './data-seep.js';
import { DataSinkError } from './data-sink.error.js';
import { DefaultDataMix } from './default-data-mix.js';

export class DataMixer<TMix extends DataMix = DataMix> {

  readonly #compounder: DataCompounder<TMix>;
  readonly #seeps = new Map<DataInfusion<unknown, unknown[]>, DataSeep<unknown, unknown[], TMix>>();

  constructor(
    ...init: DataMix extends TMix
      ? [compounder?: DataCompounder<TMix>]
      : [compounder: DataCompounder<TMix>]
  );

  constructor(compounder: DataCompounder<TMix> = DataMix$createDefault) {
    this.#compounder = compounder;
  }

  mix<T, TOptions extends unknown[]>(
    infusion: DataInfusion<T, TOptions>,
    seep: DataSeep<T, TOptions, TMix>,
  ): this {
    this.#seeps.set(
      infusion as DataInfusion<unknown, unknown[]>,
      seep as DataSeep<unknown, unknown[], TMix>,
    );

    return this;
  }

  async with(sink: DataSink<TMix>, supply: Supply = new Supply()): Promise<void> {
    const mix = this.#compounder(new DataMix$Compound(this.#seeps, supply));

    await mix(sink, supply);
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

        faucet = async (sink, supply = new Supply()) => {
          await seepFaucet(sink, supply.needs(this.#supply));
        };
      } else {
        faucet = () => Promise.reject(
            new DataSinkError(undefined, {
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

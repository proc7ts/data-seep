import { Supply } from '@proc7ts/supply';
import { DataFaucet } from '../data-faucet.js';
import { DataInfusion } from '../data-infusion.js';
import { DataSink } from '../data-sink.js';
import { withValue } from '../infusions/with-value.js';
import { DataAdmix } from './data-admix.js';
import { DataMix } from './data-mix.js';
import { DefaultDataMix } from './default-data-mix.js';
import { DataAdmix$Entry } from './impl/data-admix.entry.js';
import { DataMix$Compound } from './impl/data-mix.compound.js';
import { DataMixer$Admixes } from './impl/data-mixer.admixes.js';

/**
 * Data mixer allows to mix data originated from different {@link DataInfusion infusions},
 *
 * The resulting {@link DataMix data mix} may be used to pour the infused data.
 *
 * @typeParam TMix - Type of resulting data mix.
 */
export class DataMixer<in out TMix extends DataMix = DataMix> {

  readonly #compounder: DataMix.Compounder<TMix>;
  readonly #admixes = new DataMixer$Admixes<TMix>();

  /**
   * Constructs data mixer.
   *
   * @param init - Initialization tuple containing mixed data compounder. The one puring {@link DefaultDataMix} will be
   * used when omitted.
   */
  constructor(
    ...init: DataMix extends TMix
      ? [compounder?: DataMix.Compounder<TMix>]
      : [compounder: DataMix.Compounder<TMix>]
  );

  constructor(compounder: DataMix.Compounder<TMix> = DataMix$createDefault) {
    this.#compounder = compounder;
  }

  /**
   * Adds the given `admix` to {@link mix target data mix}.
   *
   * Replaces previously added admix.
   *
   * @typeParam T - Infused data type. I.e. the type of data poured by created faucet.
   * @typeParam TOptions - Tuple type representing infusion options.
   * @param infuse - The infusion of data pored by `admix`.
   * @param admix - Data admix to add.
   *
   * @returns Handle of added admix.
   */
  add<T, TOptions extends unknown[]>(
    infuse: DataInfusion<T, TOptions>,
    admix: DataAdmix<T, TOptions, TMix>,
  ): DataAdmix.Handle {
    const joint = this.#admixes.joint(infuse);
    const prevEntry = joint.value;
    const entry = prevEntry.extend
      ? prevEntry.extend(this, infuse, admix)
      : DataAdmix$Entry.create(this, infuse, admix);

    if (!entry) {
      const supply = admix.supply!;

      return {
        supply,
        whenSank: () => supply.whenDone(),
      };
    }

    const { supply } = entry;
    const { whenSank } = joint.pass(entry);

    supply.whenOff(() => {
      const replacement = entry.drop();

      if (replacement) {
        joint.pass(replacement);
      }
    });

    return { supply: entry.supply, whenSank };
  }

  /**
   * Mixes infused data and pours the result data mix to the given `sink`.
   *
   * @param sink - Target sink of data mix.
   * @param sinkSupply - Optional data mix `sink` supply. When cut off the mix should not be poured to target `sink`.
   *
   * @returns Promise resolved when the mix poured and sank.
   */
  async mix(sink: DataSink<TMix>, sinkSupply: Supply = new Supply()): Promise<void> {
    const mixFaucet = this.#compounder(mix => new DataMix$Compound(mix, this.#admixes));

    await mixFaucet(sink, sinkSupply);
  }

}

function DataMix$createDefault<TMix extends DataMix>(
  createCompound: (mix: TMix) => DataMix.Compound,
): DataFaucet<TMix> {
  return withValue(
    new DefaultDataMix(createCompound as (mix: DataMix) => DataMix.Compound) as DataMix as TMix,
  );
}

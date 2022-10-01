import { neverSupply, Supply } from '@proc7ts/supply';
import { DataFaucet, IntakeFaucet } from '../data-faucet.js';
import { DataInfusion } from '../data-infusion.js';
import { DataSink } from '../data-sink.js';
import { withValue } from '../infusions/with-value.js';
import { ValueJoint } from '../joints/value-joint.js';
import { DataAdmix } from './data-admix.js';
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
  readonly #admixes = new DataMixer$Admixes<TMix>();

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
   * @returns Gandle of added admix.
   */
  add<T, TOptions extends unknown[]>(admix: DataAdmix<T, TOptions, TMix>): DataAdmix.Handle {
    const joint = this.#admixes.joint(admix.infuse);
    const prevEntry = joint.value;

    prevEntry?.supply.done();

    const entry = new DataAdmix$Entry(admix);
    const { supply } = entry;

    if (supply.isOff) {
      return {
        supply,
        whenSank: () => supply.whenDone(),
      };
    }

    const { whenSank } = joint.add(entry);

    supply.whenOff(() => {
      if (joint.value === entry) {
        joint.add({ supply });
      }
    });

    return { supply, whenSank };
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
    const mixFaucet = this.#compounder(mix => new DataMix$Compound(mix, this.#admixes));

    await mixFaucet(sink, sinkSupply);
  }

}

class DataMixer$Admixes<TMix extends DataMix> {

  readonly #admixes = new Map<
    DataInfusion<unknown, unknown[]>,
    ValueJoint<DataAdmix$Entry<unknown, unknown[], TMix> | DataAdmix$Removed>
  >();

  joint<T, TOptions extends unknown[]>(
    infusion: DataInfusion<T, TOptions>,
  ): ValueJoint<DataAdmix$Entry<T, TOptions, TMix> | DataAdmix$Removed> {
    let admixJoint = this.#admixes.get(infusion as DataInfusion<unknown, unknown[]>) as
      | ValueJoint<DataAdmix$Entry<T, TOptions, TMix> | DataAdmix$Removed>
      | undefined;

    if (!admixJoint) {
      admixJoint = new ValueJoint<DataAdmix$Entry<T, TOptions, TMix> | DataAdmix$Removed>({
        supply: neverSupply(),
      });
      this.#admixes.set(
        infusion as DataInfusion<unknown, unknown[]>,
        admixJoint as ValueJoint<DataAdmix$Entry<unknown, unknown[], TMix> | DataAdmix$Removed>,
      );
    }

    return admixJoint;
  }

}

class DataMix$Compound<TMix extends DataMix> implements DataMixCompound {

  readonly #mix: TMix;
  readonly #admixes: DataMixer$Admixes<TMix>;

  constructor(mix: TMix, admixes: DataMixer$Admixes<TMix>) {
    this.#mix = mix;
    this.#admixes = admixes;
  }

  watch<T, TOptions extends unknown[]>(
    infuse: DataInfusion<T, TOptions>,
  ): DataFaucet<DataAdmix.Update<T, TOptions>> {
    const admixJoint = this.#admixes.joint(infuse);

    return async (sink, sinkSupply) => await admixJoint.faucet(async admix => {
        if (admix.pour) {
          await sink({ infuse, supply: admix.supply, faucet: admix.pour(this.#mix) });
        } else {
          await sink({ infuse, supply: admix.supply });
        }
      }, sinkSupply);
  }

}

function DataMix$createDefault<TMix extends DataMix>(
  createCompound: (mix: TMix) => DataMixCompound,
): DataFaucet<TMix> {
  return withValue(
    new DefaultDataMix(createCompound as (mix: DataMix) => DataMixCompound) as DataMix as TMix,
  );
}

class DataAdmix$Entry<T, TOptions extends unknown[], TMix extends DataMix> {

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

interface DataAdmix$Removed {
  readonly supply: Supply;
  readonly pour?: undefined;
}

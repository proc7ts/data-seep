import { DataFaucet, IntakeFaucet } from '../data-faucet.js';
import { DataInfusion } from '../data-infusion.js';
import { withAll, WithAll } from '../infusions/with-all.js';
import { withNone } from '../infusions/with-none.js';
import { switchSeep } from '../seeps/switch.seep.js';
import { DataAdmix } from './data-admix.js';

/**
 * Data mix provides access to data {@link DataMixer#mix mixed into data mixer}.
 */
export abstract class DataMix implements DataMix.Compound {

  /**
   * Pours updates to admixes infusing data by particular `infusion`.
   *
   * @typeParam T - Infused data type. I.e. the type of data poured by returned faucet.
   * @typeParam TOptions - Infusion options.
   * @param infusion - Source data infusion.
   *
   * @returns Admix updates faucet.
   */
  abstract watch<T, TOptions extends unknown[]>(
    infusion: DataInfusion<T, TOptions>,
  ): DataFaucet<DataAdmix.Update<T, TOptions>>;

  /**
   * Pours the data originated from the given data `infusion`.
   *
   * @typeParam T - Infused data type. I.e. the type of data poured by returned faucet.
   * @typeParam TOptions - Infusion options.
   * @param infusion - Source infusion.
   *
   * @returns Infused data faucet.
   */
  pour<T, TOptions extends unknown[]>(infusion: DataInfusion<T, TOptions>): DataFaucet<T> {
    return switchSeep(({ faucet = withNone() }: DataAdmix.Update<T, TOptions>) => faucet)(
      this.watch(infusion),
    );
  }

  /**
   * Pours record(s) with property values originated from all of the given infuses.
   *
   * @typeParam TInfuses - Type of infuses record.
   * @param infusions - Infuses record.
   *
   * @returns Faucet of records containing values infused by each infusion under corresponding key.
   */
  pourAll<TInfusions extends DataMix.Infusions>(
    infusions: TInfusions,
  ): DataFaucet<DataMix.SeepType<TInfusions>> {
    const intakes = Object.fromEntries(
      Object.entries(infusions).map(([key, infusion]) => [key, this.pour(infusion)]),
    ) as WithAll.Intakes;

    return withAll(intakes) as DataFaucet<DataMix.SeepType<TInfusions>>;
  }

}

export namespace DataMix {
  /**
   * Mixed data compound.
   *
   * Provides access to data infused into some data mix.
   *
   * Used by {@link DataMix.Compounder} to provide custom data mix implementation.
   *
   * @typeParam TMix - Supported data mix.
   */
  export interface Compound {
    /**
     * Pours updates to admixes infusing data by particular `infusion`.
     *
     * @typeParam T - Infused data type. I.e. the type of data poured by returned faucet.
     * @typeParam TOptions - Infusion options.
     * @param infusion - Source data infusion.
     *
     * @returns Admix updates faucet.
     */
    watch<T, TOptions extends unknown[]>(
      infusion: DataInfusion<T, TOptions>,
    ): DataFaucet<DataAdmix.Update<T, TOptions>>;
  }

  /**
   * Mixed data compounder used by {@link DataMixer data mixer} to customize data mix implementation.
   *
   * @typeParam TMix - Type of supported data mix.
   * @param createCompound - Mixed data compound factory function, accepting a data mix instance as its only parameter.
   *
   * @returns Custom data mix faucet.
   */
  export type Compounder<out TMix extends DataMix = DataMix> = (
    createCompound: (this: void, mix: TMix) => Compound,
  ) => IntakeFaucet<TMix>;

  /**
   * Infuses record for data faucet created by {@link DataMix#pourAll} method.
   *
   * Contains {@link DataInfusion source infusions} under arbitrary keys. The poured record would be combined of
   * data values under the same keys corresponding to each infusion.
   */
  export type Infusions = {
    readonly [key in PropertyKey]: DataInfusion<unknown, any[]>;
  };

  /**
   * Type of record poured by data faucet created by {@link DataMix#pourAll} method.
   *
   * @typeParam TIntakes - Type of infuses record.
   */
  export type SeepType<TInfusions extends Infusions> = {
    [key in keyof TInfusions]: DataInfusion.SeepType<TInfusions[key]>;
  };
}

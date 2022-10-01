import { Supply } from '@proc7ts/supply';
import { DataFaucet } from '../data-faucet.js';
import { DataInfusion } from '../data-infusion.js';
import { withAll, WithAll } from '../infusions/with-all.js';
import { DataAdmix } from './data-admix.js';

/**
 * Data mix provides access to data {@link DataMixer#mix mixed into data mixer}.
 */
export abstract class DataMix {

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
    const admixFaucet = this.watch(infusion);

    return async (sink, sinkSupply = new Supply()) => await admixFaucet(async ({ faucet }) => {
        await faucet?.(sink, sinkSupply);
      });
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

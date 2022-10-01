import { DataFaucet, IntakeFaucet } from '../data-faucet.js';
import { DataInfusion } from '../data-infusion.js';
import { DataAdmix } from './data-admix.js';
import { DataMix } from './data-mix.js';

/**
 * Mixed data compound.
 *
 * Provides access to data infused into some data mix.
 *
 * Used by {@link DataMixCompounder} to provide custom data mix implementation.
 *
 * @typeParam TMix - Supported data mix.
 */
export interface DataMixCompound {
  /**
   * Pours updates to admixes infusing data by particular `infusion`.
   *
   * @typeParam T - Infused data type. I.e. the type of data poured by returned faucet.
   * @typeParam TOptions - Infusion options.
   * @param infusion - Source data infusion.
   *
   * @returns Admix updates faucet.
   */
  watch<T, TOptions extends []>(
    infusion: DataInfusion<T, TOptions>,
  ): DataFaucet<DataAdmix.Update<T>>;
}

/**
 * Mixed data compounder used by {@link DataMixer data mixer} to customize data mix implementation.
 *
 * @typeParam TMix - Type of supported data mix.
 * @param createCompound - Mixed data compound factory function, accepting a data mix instance as its only parameter.
 *
 * @returns Custom data mix faucet.
 */
export type DataMixCompounder<out TMix extends DataMix = DataMix> = (
  createCompound: (mix: TMix) => DataMixCompound,
) => IntakeFaucet<TMix>;

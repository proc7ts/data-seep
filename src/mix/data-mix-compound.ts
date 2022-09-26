import { DataFaucet, IntakeFaucet } from '../data-faucet.js';
import { DataInfusion } from '../data-infusion.js';
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
export interface DataMixCompound<TMix extends DataMix = DataMix> {
  /**
   * Pours data infused into the `mix` by particular `infusion`.
   *
   * @typeParam T - Infused data type. I.e. the type of data poured by returned faucet.
   * @typeParam TOptions - Infusion options.
   * @param infusion - Source data infusion.
   * @param mix - Source data mix.
   *
   * @returns Infused data faucet.
   */
  pour<T, TOptions extends unknown[]>(
    infusion: DataInfusion<T, TOptions>,
    mix: TMix,
  ): DataFaucet<T>;
}

/**
 * Mixed data compounder used by {@link DataMixer data mixer} to customize data mix implementation.
 *
 * @typeParam TMix - Type of supported data mix.
 * @param compound - Mixed data compound.
 *
 * @returns Custom data mix faucet.
 */
export type DataMixCompounder<TMix extends DataMix = DataMix> = (
  compound: DataMixCompound<TMix>,
) => IntakeFaucet<TMix>;

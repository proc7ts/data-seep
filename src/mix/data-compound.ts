import { Supply } from '@proc7ts/supply';
import { DataFaucet, IntakeFaucet } from '../data-faucet.js';
import { DataInfusion } from '../data-infusion.js';
import { DataMix } from './data-mix.js';

/**
 * Mixed data compound.
 *
 * Provides access to data infused into some data mix.
 *
 * Used by {@link DataCompounder} to provide custom data mix implementation.
 *
 * @typeParam TMix - Supported data mix.
 */
export interface DataCompound<TMix extends DataMix = DataMix> {
  /**
   * Data mix supply.
   *
   * When cut off the compond may no longer be used.
   */
  readonly supply: Supply;

  /**
   * Provides access to data infused into the `mix` by particular `infusion`.
   *
   * @typeParam T - Infused data type. I.e. the type of data poured by returned faucet.
   * @typeParam TOptions - Infusion options.
   * @param infusion - Source data infusion.
   * @param mix - Source data mix.
   *
   * @returns Infused data faucet.
   */
  faucetFor<T, TOptions extends unknown[]>(
    infusion: DataInfusion<T, TOptions>,
    mix: TMix,
  ): DataFaucet<T>;
}

/**
 * Data compounder used by {@link DataMixer data mixer} to customize data mix implementation.
 *
 * @typeParam TMix - Type of supported data mix.
 * @param compound - Mixed data compound.
 *
 * @returns Custom data mix faucet.
 */
export type DataCompounder<TMix extends DataMix = DataMix> = (
  compound: DataCompound<TMix>,
) => IntakeFaucet<TMix>;

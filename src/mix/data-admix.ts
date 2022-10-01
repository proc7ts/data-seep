import { Supply } from '@proc7ts/supply';
import { IntakeFaucet } from '../data-faucet.js';
import { DataInfusion } from '../data-infusion.js';
import { DataMix } from './data-mix.js';

/**
 * Data admixture (ingredient) of {@link DataMix data mix}.
 *
 * When {@link DataMixer#add added} to data mixture, the resulting data mix provides access to the data poured by
 * corresponding {@link DataAdmix#infuse data infusion}.
 *
 * Names of functions creating data admixes supposed to have an `admix` prefix. E.g. {@link admix}
 * or {@link admixValue},
 *
 * @typeParam T - Infused data type.
 * @typeParam TOptions - Tuple type representing infusion options.
 * @typeParam TMix - Type of resulting data mix.
 */
export interface DataAdmix<
  out T,
  in TOptions extends unknown[] = [],
  in TMix extends DataMix = DataMix,
> {
  /**
   * The infusion of the data poured by this admix.
   */
  readonly infuse: DataInfusion<T, TOptions>;

  /**
   * Optional admix supply.
   *
   * Once cut off, the admix will be removed from the mix and thus won't pour any data.
   *
   * This supply will be returrned from {@link DataMixer#add} method. New one will be created otherwise.
   */
  readonly supply?: Supply | undefined;

  /**
   * Pours data infused to the given data `mix`.
   *
   * @param mix - Target data mix.
   *
   * @returns Infused data faucet.
   */
  pour(mix: TMix): IntakeFaucet<T>;
}

export namespace DataAdmix {
  /**
   * Admix handle created when admix {@link DataMixer#add added} to mix.
   */
  export interface Handle {
    /**
     * Admix supply.
     *
     * Once cut off, the `admix` will be removed from the mix and thus won't pour any data.
     */
    readonly supply: Supply;

    /**
     * Awaits for admix to actually added to the mix and sank by consumers.
     *
     * @returns Promise resolved when admix sank by its consumers.
     */
    whenSank(this: void): Promise<void>;
  }

  /**
   * An update to admix.
   *
   * Either {@link Added added}, or {@link Removed} admix info.
   *
   * @typeParam T - Type of data infused by admix.
   * @typeParam TOptions - Tuple type representing infusion options.
   */
  export type Update<T, TOptions extends unknown[]> = Added<T, TOptions> | Removed<T, TOptions>;

  /**
   * Information about admix {@link DataMixer#add added} to the mix.
   *
   * @typeParam T - Type of data infused by added admix.
   * @typeParam TOptions - Tuple type representing infusion options.
   */
  export interface Added<out T, in TOptions extends unknown[]> {
    /**
     * The infusion of the data poured by added admix.
     */
    readonly infuse: DataInfusion<T, TOptions>;

    /**
     * Admix supply.
     *
     * Once cut off, the admix will be removed from the mix and thus won't pour any data.
     */
    readonly supply: Supply;

    /**
     * Faucet that pours the data infused by admix.
     */
    readonly faucet: IntakeFaucet<T>;
  }

  /**
   * Information about admix removed from the mix.
   *
   * @typeParam T - Type of data infused by added admix.
   * @typeParam TOptions - Tuple type representing infusion options.
   */
  export interface Removed<out T, in TOptions extends unknown[]> {
    /**
     * The infusion of the data poured by removed admix.
     */
    readonly infuse: DataInfusion<T, TOptions>;

    /**
     * Cut off  admix supply.
     */
    readonly supply: Supply;

    readonly faucet?: undefined;
  }
}

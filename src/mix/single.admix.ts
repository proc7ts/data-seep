import { Supply } from '@proc7ts/supply';
import { IntakeFaucet } from '../data-faucet.js';
import { DataInfusion } from '../data-infusion.js';
import { DataMix } from './data-mix.js';

/**
 * Single-ingredient admixture of {@link DataMix data mix}.
 *
 * This implementation just {@link SingleAdmix#pour pours} infused data.
 *
 * @typeParam T - Infused data type.
 * @typeParam TOptions - Tuple type representing infusion options.
 * @typeParam TMix - Type of resulting data mix.
 */
export interface SingleAdmix<
  out T,
  in TOptions extends unknown[] = [],
  out TMix extends DataMix = DataMix,
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

  readonly blend?: undefined;

  readonly replace?: undefined;
}

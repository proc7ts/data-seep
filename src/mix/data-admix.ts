import { Supply } from '@proc7ts/supply';
import { IntakeFaucet } from '../data-faucet.js';
import { DataInfusion } from '../data-infusion.js';
import { DataMix } from './data-mix.js';

/**
 * Data admixture (ingredient) of {@link DataMix data mix}.
 *
 * When {@link DataMixer#add added} to data mixture, the resulting data mix provides access to the data poured by
 * corresponding {@link DataAdmix#infusion data infusion}.
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
   * The infusion of data this admix pours.
   */
  readonly infusion: DataInfusion<T, TOptions>;

  /**
   * Optional admix supply.
   *
   * Once cut off, the admix will be removed from the mix and thus won't pour any data.
   *
   * This supply will be returrned from {@link DataMixer#add} method. New one will be created otherwise.
   */
  readonly supply?: Supply | undefined;

  /**
   * Creates infused data asset for the given data `mix`.
   *
   * @param mix - Target data mix.
   *
   * @returns Infused data faucet.
   */
  pour(mix: TMix): IntakeFaucet<T>;
}

/**
 * Creates a data admix that infuses data by faucet with the given `options`.
 *
 * @typeParam T - Infused data type.
 * @typeParam TOptions - Tuple type representing infusion options.
 * @param infusion - Source data infusion.
 * @param options - Custom infusion options.
 *
 * @returns New data admix.
 */
export function admix<T, TOptions extends unknown[]>(
  infusion: DataInfusion<T, TOptions>,
  ...options: TOptions
): DataAdmix<T, TOptions> {
  return {
    infusion,
    pour(_mix) {
      return infusion(...options);
    },
  };
}

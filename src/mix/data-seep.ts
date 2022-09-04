import { IntakeFaucet } from '../data-faucet.js';
import { DataInfusion } from '../data-infusion.js';
import { DataMix } from './data-mix.js';

/**
 * Data seep for particular {@link DataInfusion infusion}.
 *
 * {@link DataMixer#infuse Infuses} the data for the {@link DataMix mix}.
 *
 * Names of functions creating data seeps supposed to have a `seep` prefix. E.g. {@link seep}, or {@link seepValue},
 *
 * @typeParam T - Infused data type.
 * @typeParam TOptions - Tuple type representing infusion options.
 * @typeParam TMix - Type of resulting data mix.
 * @param infusion - Source infusion to infuse the poured data with.
 * @param mix - Target data mix.
 *
 * @returns Infused data faucet.
 */
export type DataSeep<
  in out T,
  out TOptions extends unknown[] = [],
  in TMix extends DataMix = DataMix,
> = (infusion: DataInfusion<T, TOptions>, mix: TMix) => IntakeFaucet<T>;

/**
 * Creates a data seep that constructs infused data faucet with the given infusion `options`.
 *
 * @typeParam T - Infused data type.
 * @typeParam TOptions - Tuple type representing infusion options.
 * @param options - Custom infusion options.
 *
 * @returns New data seep.
 */
export function seep<T, TOptions extends unknown[]>(...options: TOptions): DataSeep<T, TOptions> {
  return infusion => infusion(...options);
}

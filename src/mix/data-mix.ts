import { DataFaucet } from '../data-faucet.js';
import { DataInfusion } from '../data-infusion.js';

/**
 * Data mix provides access to data {@link DataMixer#mix mixed into data mixer}.
 */
export abstract class DataMix {

  /**
   * Pours the data originated from the given data `infusion`.
   *
   * @typeParam T - Infused data type. I.e. the type of data poured by returned faucet.
   * @typeParam TOptions - Infusion options.
   * @param infusion - Source infusion.
   *
   * @returns Infused data faucet.
   */
  abstract pour<T, TOptions extends unknown[]>(infusion: DataInfusion<T, TOptions>): DataFaucet<T>;

}

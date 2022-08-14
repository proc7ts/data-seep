import { DataFaucet } from '../data-faucet.js';
import { DataInfusion } from '../data-infusion.js';

export abstract class DataMix {

  abstract flow<T, TOptions extends unknown[]>(infusion: DataInfusion<T, TOptions>): DataFaucet<T>;

}

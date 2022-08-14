import { IntakeFaucet } from '../data-faucet.js';
import { DataInfusion } from '../data-infusion.js';
import { DataMix } from './data-mix.js';

export type DataSeep<in out T, out TOptions extends unknown[] = [], in TMix extends DataMix = DataMix> =
    (infusion: DataInfusion<T, TOptions>, mix: TMix) => IntakeFaucet<T>;

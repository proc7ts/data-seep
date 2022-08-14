import { DataFaucet } from './data-faucet.js';

export type DataInfusion<out T, in TOptions extends unknown[]> = (...options: TOptions) => DataFaucet<T>;

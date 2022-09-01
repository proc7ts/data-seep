import { Supply } from '@proc7ts/supply';
import { DataFaucet, IntakeFaucet } from '../data-faucet.js';
import { DataInfusion } from '../data-infusion.js';
import { DataMix } from './data-mix.js';

export interface DataCompound<TMix extends DataMix = DataMix> {
  readonly supply: Supply;

  faucetFor<T, TOptions extends unknown[]>(
    infusion: DataInfusion<T, TOptions>,
    mix: TMix,
  ): DataFaucet<T>;
}

export type DataCompounder<TMix extends DataMix = DataMix> = (
  compound: DataCompound<TMix>,
) => IntakeFaucet<TMix>;

import { Supply } from '@proc7ts/supply';
import { DataFaucet, FaucetKind, IntakeFaucet } from '../data-faucet.js';

export abstract class DataFlux {

  abstract flow<T, TOptions extends unknown[]>(kind: FaucetKind<T, TOptions>): DataFaucet<T>;

}

export namespace DataFlux {

  export type Factory<TFlux extends DataFlux = DataFlux> = (source: Source<TFlux>) => IntakeFaucet<TFlux>;

  export interface Source<TFlux extends DataFlux = DataFlux> {

    readonly supply: Supply;

    faucetFor<T, TOptions extends unknown[]>(kind: FaucetKind<T, TOptions>, flux: TFlux): DataFaucet<T>;

  }

}

import { Supply } from '@proc7ts/supply';
import { DataFaucet, FaucetKind, IntakeFaucet } from '../data-faucet.js';

export abstract class DataSeep {

  abstract do<T, TOptions extends unknown[]>(kind: FaucetKind<T, TOptions>): DataFaucet<T>;

}

export namespace DataSeep {

  export type Intake<in out T, out TOptions extends unknown[], TSeep extends DataSeep = DataSeep> =
      (kind: FaucetKind<T, TOptions>, seep: TSeep) => IntakeFaucet<T>;

  export type Factory<TSeep extends DataSeep = DataSeep> = (seeper: Seeper<TSeep>) => IntakeFaucet<TSeep>;

  export interface Seeper<TSeep extends DataSeep = DataSeep> {

    readonly supply: Supply;

    faucetFor<T, TOptions extends unknown[]>(kind: FaucetKind<T, TOptions>, seep: TSeep): DataFaucet<T>;

  }

}

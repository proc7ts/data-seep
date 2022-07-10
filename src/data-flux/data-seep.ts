import { FaucetKind, IntakeFaucet } from '../data-faucet.js';
import { DataFlux } from './data-flux.js';

export type DataSeep<in out T, out TOptions extends unknown[] = [], TFlux extends DataFlux = DataFlux> =
    (kind: FaucetKind<T, TOptions>, flux: TFlux) => IntakeFaucet<T>;

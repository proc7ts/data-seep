import { DataFaucet, FaucetKind } from '../data-faucet.js';
import { DataFlux } from './data-flux.js';

export class DefaultDataFlux extends DataFlux {

  readonly #source: DataFlux.Source;

  constructor(source: DataFlux.Source) {
    super();
    this.#source = source;
  }

  flow<T, TOptions extends []>(kind: FaucetKind<T, TOptions>): DataFaucet<T> {
    return this.#source.faucetFor(kind, this);
  }

}

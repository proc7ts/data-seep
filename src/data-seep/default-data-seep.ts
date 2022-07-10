import { DataFaucet, FaucetKind } from '../data-faucet.js';
import { DataSeep } from './data-seep.js';

export class DefaultDataSeep extends DataSeep {

  readonly #seeper: DataSeep.Seeper;

  constructor(seeper: DataSeep.Seeper) {
    super();
    this.#seeper = seeper;
  }

  do<T, TOptions extends []>(kind: FaucetKind<T, TOptions>): DataFaucet<T> {
    return this.#seeper.faucetFor(kind, this);
  }

}

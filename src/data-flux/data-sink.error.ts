import { FaucetKind } from '../data-faucet.js';

export class DataSinkError extends ReferenceError {

  readonly #faucetKind: FaucetKind<unknown, unknown[]>;

  constructor(message: string | undefined, options: DataSeepErrorOptions) {

    const { faucetKind } = options;

    super(message ?? `Can not sink ${faucetKind.name}`, options);

    this.name = 'DataSinkError';
    this.#faucetKind = faucetKind;
  }

  get faucetKind(): FaucetKind<unknown, unknown[]> {
    return this.#faucetKind;
  }

}

export interface DataSeepErrorOptions extends ErrorOptions {

  readonly faucetKind: FaucetKind<unknown, unknown[]>;

}

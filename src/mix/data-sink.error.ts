import { DataInfusion } from '../data-infusion.js';

export class DataSinkError extends ReferenceError {

  readonly #infusion: DataInfusion<unknown, unknown[]>;

  constructor(message: string | undefined, options: DataSeepErrorOptions) {
    const { infusion } = options;

    super(message ?? `Can not sink ${infusion.name}`, options);

    this.name = 'DataSinkError';
    this.#infusion = infusion;
  }

  get infusion(): DataInfusion<unknown, unknown[]> {
    return this.#infusion;
  }

}

export interface DataSeepErrorOptions extends ErrorOptions {
  readonly infusion: DataInfusion<unknown, unknown[]>;
}

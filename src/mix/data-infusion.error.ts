import { DataInfusion } from '../data-infusion.js';

/**
 * Error indicating the data is not infused with the given infusion.
 */
export class DataInfusionError extends ReferenceError {

  readonly #infusion: DataInfusion<unknown, unknown[]>;

  /**
   * Constructs data infusion error.
   *
   * @param message - Error message.
   * @param options - Error initialization options.
   */
  constructor(message: string | undefined, options: DataInfusionErrorOptions) {
    const { infusion } = options;

    super(message ?? `Not infused ${infusion.name}`, options);

    this.name = 'DataInfusionError';
    this.#infusion = infusion;
  }

  /**
   * Missing data infusion.
   */
  get infusion(): DataInfusion<unknown, unknown[]> {
    return this.#infusion;
  }

}

/**
 * Initialization options of {@link DataInfusionError}.
 */
export interface DataInfusionErrorOptions extends ErrorOptions {
  /**
   * Missing data infusion.
   */
  readonly infusion: DataInfusion<unknown, unknown[]>;
}

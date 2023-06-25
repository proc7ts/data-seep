/**
 * Error indicating a valve is {@link Valve#close closed} abruptly.
 */
export class ValveClosedError extends TypeError {

  /**
   * Constructs error.
   *
   * @param message - Custom error message.
   * @param options - Error options.
   */
  constructor(message = 'Valve closed', options?: ErrorOptions) {
    super(message, options);
    this.name = 'ValveClosedError';
  }

}

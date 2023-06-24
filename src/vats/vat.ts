import { Sink } from '../sink.js';

/**
 * Vat is a reusable {@link Faucet faucet} that can pour data to multiple sinks.
 *
 * Vat may pour data many times to multiple sinks. Data values may be poured either sequentially or in parallel
 * to each other.
 *
 * To start pouring the data, open the vat by calling it _with arguments_. To pour the data to another sink - call
 * it again {@link withInflow downstream} _without arguments_.
 *
 * Data pouring can be stopped explicitly by closing the {@link withValve valve}.
 *
 * Vats created by {@link createVat} function.
 *
 * @typeParam T - Poured data type.
 * @typeParam TArgs - Type of vat arguments.
 */
export interface Vat<out T, in TArgs extends unknown[] = unknown[]> {
  /**
   * Opens vat and starts data pouring.
   *
   * @param args - Vat arguments followed by target sink.
   *
   * @returns Promise resolved when all data poured and sank.
   */
  (this: void, ...args: [...TArgs, Sink<T>]): Promise<void>;

  /**
   * Pours the data from previously opened vat to another `sink`.
   *
   * If the vat is not yet opened yet, may either open it with default arguments, or reject the sink.
   *
   * @param sink - Target sink.
   *
   * @returns Promise resolved when all data poured and sank.
   */
  (this: void, sink: Sink<T>): Promise<void>;
}

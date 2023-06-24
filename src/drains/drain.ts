import { Sink } from '../sink.js';

/**
 * Drain is like a {@link Faucet faucet} that can pour data to multiple sinks.
 *
 * Drain may pour data many times to multiple sinks. Data values may be poured either sequentially or in parallel
 * to each other.
 *
 * To start pouring the data, open the drain by calling it _with arguments_. To pour the data to another sink - call
 * it again {@link withInflow downstream} _without arguments_.
 *
 * Data pouring to particular sink can be stopped explicitly by closing corresponding {@link withValve valve}.
 *
 * Drains created by {@link createDrain} function.
 *
 * @typeParam T - Poured data type.
 * @typeParam TArgs - Type of drain arguments.
 */
export interface Drain<out T, in TArgs extends unknown[] = unknown[]> {
  /**
   * Opens the drain and starts data pouring.
   *
   * @param args - Drain arguments followed by target sink.
   *
   * @returns Promise resolved when all data poured and sank.
   */
  (this: void, ...args: [...TArgs, Sink<T>]): Promise<void>;

  /**
   * Pours the data from previously opened drain to another `sink`.
   *
   * If the drain is not yet opened yet, may either open it with default arguments, or reject the sink.
   *
   * @param sink - Target sink.
   *
   * @returns Promise resolved when all data poured and sank.
   */
  (this: void, sink: Sink<T>): Promise<void>;
}

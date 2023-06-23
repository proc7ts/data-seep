import { Sink } from '../sink.js';

/**
 * Refaucet is a reusable {@link Faucet} that can pour data to multiple sinks.
 *
 * Refaucet may pour data many times to multiple sinks. Data values may be poured either sequentially or in parallel
 * to each other.
 *
 * To start pouring the data, call the refaucet _with arguments_. To pour the data to another sink - call it again
 * {@link withInflow downstream} _without arguments_.
 *
 * Data pouring can be stopped explicitly by closing the {@link withValve valve}.
 *
 * Refaucets created by {@link createRefaucet} function.
 *
 * @typeParam T - Poured data type.
 * @typeParam TArgs - Type of faucet arguments.
 */
export interface Refaucet<out T, in TArgs extends unknown[] = unknown[]> {
  /**
   * Starts data pouring.
   *
   * @param args - Faucet arguments followed by target sink.
   *
   * @returns Promise resolved when all data poured and sank.
   */
  (this: void, ...args: [...TArgs, Sink<T>]): Promise<void>;

  /**
   * Pours the data from previously started refaucet to another `sink`.
   *
   * If data pouring is not yet started, may either start the data pouring with default arguments, or reject the sink.
   *
   * @param sink - Target sink.
   *
   * @returns Promise resolved when all data poured and sank.
   */
  (this: void, sink: Sink<T>): Promise<void>;
}

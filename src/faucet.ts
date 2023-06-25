import { Sink } from './sink.js';

/**
 * Faucet is a function that generates data and pours it to {@link Sink sink}. Once the data value sank it may be
 * invalidated. Generally, it is illegal to use the data values outside the target `sink`.
 *
 * Faucet may pour the data many times. Data values may be poured either sequentially or in parallel to each other.
 *
 * The promise returned from the faucet resolves once all poured data processed (sank) by target `sink`.
 *
 * Data pouring can be stopped explicitly by closing the {@link withValve valve}.
 *
 * Faucet can be created with {@link createFaucet} function. It handles the {@link withValve valve} closing. It also
 * ensures that the returned promise resolves only when all data sank.
 *
 * @typeParam T - Poured data type.
 * @typeParam TArgs - Type of faucet arguments.
 * @param args - Faucet arguments followed by target sink.
 *
 * @returns Promise resolved when all data poured and sank.
 */
export type Faucet<out T, in TArgs extends unknown[] = []> = (
  this: void,
  ...args: [...TArgs, Sink<T>]
) => Promise<void>;

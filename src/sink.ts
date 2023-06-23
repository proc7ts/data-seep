/**
 * Sink is a function that sinks the data poured by {@link Faucet faucet}.
 *
 * The poured `value` is passed as first argument, and can be used inside the sink function, but can not be used outside
 * of it after processing.
 *
 * The `value` can be sank either synchronously or asynchronously.
 *
 * @typeParam T - Type of data values to sink.
 * @param value - Data value to sink.
 *
 * @returns Either none when the value sank synchronously, or a promise-like instance resolved when the value sank
 * asynchronously.
 */
export type Sink<in T> = (this: void, value: T) => void | PromiseLike<void>;

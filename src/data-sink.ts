/**
 * Data sink is a function that sinks data value(s) poured by {@link DataFaucet data faucet}.
 *
 * The poured `value` is passed as first argument, and can be used by sink function, but can not be used outside after
 * processing.
 *
 * The `value` can be sank either synchronously or asynchronously.
 *
 * @typeParam T - Type of data values to sink.
 * @param value - Data value to sink.
 *
 * @returns Either none when the value sank synchronously, or a promise-like instance resolved when the value sank
 * asynchronously.
 */
export type DataSink<in T> = (this: void, value: T) => void | PromiseLike<unknown>;

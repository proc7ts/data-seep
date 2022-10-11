import { SupplyOut } from '@proc7ts/supply';

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

/**
 * Asynchronous {@link DataSink data sink} always returns a promise.
 *
 * Arbitrary data sink can be converted to asynchronous one by {@link DataSink:function DataSink} function.
 *
 * @typeParam T - Type of data values to sink.
 * @param value - Data value to sink.
 *
 * @returns Promise resolved when the value sank asynchronously.
 */
export type AsyncSink<in T> = (this: void, value: T) => Promise<void>;

/**
 * Converts arbitrary {@link DataSink data sink} to {@link AsyncSink asynchronous} one.
 *
 * @typeParam T - Type of data values to sink.
 * @param sink - Data sink to convert.
 * @param sinkSupply - Data sink supply. Once cut off the data would not be sank any more.
 *
 * @returns Asynchronous data sink.
 */
export function DataSink<T>(sink: DataSink<T>, sinkSupply?: SupplyOut): AsyncSink<T> {
  sinkSupply?.whenOff(() => {
    sink = async _value => await sinkSupply.whenDone();
  });

  return async value => {
    await sink(value);
  };
}

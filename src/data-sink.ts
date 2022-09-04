import { Supplier, Supply } from '@proc7ts/supply';

/**
 * Data sink is a function that sinks data value(s) poured by {@link DataFaucet data faucet}.
 *
 * The poured `value` is passed as first argument, and can be used by sink function, but can not be used outside after
 * processing.
 *
 * The `value` can be sank either synchronously or asynchronously. When a {@link Supplier} is a result of sink function
 * call, the `value` considered processed and sank when that supplier cut off.
 *
 * @typeParam T - Type of data values to sink.
 * @param value - Data value to sink.
 * @param valueSupply - Data value supply. Once cut off the, `value` processing stops and the `value` can not be used
 * any more. This supply can be used to inform the faucet when the value sank.
 *
 * @returns Either none when the value sank synchronously, a promise resolved to nothing when the value sank
 * asynchronously, a supplier instance that is cut off once the value sank, or a promise resolved to such supplier
 * instance.
 */
export type DataSink<in T> = (
  this: void,
  value: T,
  valueSupply: Supply,
) => Supplier | Promise<Supplier | void> | void;

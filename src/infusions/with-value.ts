import { DataFaucet } from '../data-faucet.js';
import { DataSink } from '../data-sink.js';

/**
 * Creates data faucet that pours single `value` to target sink.
 *
 * @typeParam T - Poured data value type.
 * @param value - Value to pour.
 *
 * @returns Data `value` faucet.
 */
export function withValue<T>(value: T | PromiseLike<T>): DataFaucet<T> {
  return async (sink, sinkSupply) => {
    await DataSink(sink, sinkSupply)(await value);
  };
}

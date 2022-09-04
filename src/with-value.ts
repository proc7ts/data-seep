import { DataFaucet } from './data-faucet.js';
import { sinkValue } from './sink-value.js';

/**
 * Creates data faucet that pours a single `value` to target sink.
 *
 * @typeParam T - Poured data value type.
 * @param value - Value to pour.
 *
 * @returns Data `value` faucet.
 */
export function withValue<T>(value: T | PromiseLike<T>): DataFaucet<T> {
  return async (sink, supply) => await sinkValue(value, sink, supply);
}

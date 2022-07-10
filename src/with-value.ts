import { DataFaucet } from './data-faucet.js';
import { sinkValue } from './sink-value.js';

export function withValue<T>(value: T | PromiseLike<T>): DataFaucet<T> {
  return async (sink, supply) => await sinkValue(value, sink, supply);
}

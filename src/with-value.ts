import { DataSink } from './data-sink.js';
import { sinkValue } from './sink-value.js';

export async function withValue<T>(value: T | PromiseLike<T>, sink: DataSink<T>): Promise<void> {
  await sinkValue(value, async (value, supply) => {
    await sink(value, supply);
  });
}

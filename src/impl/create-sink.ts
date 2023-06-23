import { Sink } from '../sink.js';

export function createSink<T>(
  resolve: () => void,
  reject: (reason: unknown) => void,
  sink: Sink<T>,
): Sink<T> {
  let sinkCount = 0;

  return async (value: T) => {
    ++sinkCount;
    try {
      await sink(value);
      if (!--sinkCount) {
        resolve();
      }
    } catch (error) {
      reject(error);
      throw error;
    }
  };
}

import { ValveClosedError } from '../faucets/valve-closed.error.js';
import { whenClosed } from '../faucets/with-valve.js';
import { Sink } from '../sink.js';

export function createSink<T>(
  resolve: () => void,
  reject: (reason: unknown) => void,
  sink: Sink<T>,
): Sink<T> {
  let sinkCount = 0;
  let isClosed = false;
  let done = resolve;

  return async (value: T) => {
    whenClosed(reason => {
      isClosed = true;
      if (!sinkCount) {
        Valve$close(resolve, reject, reason);
      } else {
        done = () => Valve$close(resolve, reject, reason);
      }
    });

    if (isClosed) {
      return;
    }

    ++sinkCount;
    try {
      await sink(value);
      if (!--sinkCount) {
        done();
      }
    } catch (error) {
      reject(error);
      throw error;
    }
  };
}

function Valve$close(resolve: () => void, reject: (reason: unknown) => void, cause: unknown): void {
  if (cause === undefined) {
    resolve();
  } else {
    reject(
      typeof cause === 'string'
        ? new ValveClosedError(cause)
        : new ValveClosedError(undefined, { cause }),
    );
  }
}

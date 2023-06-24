import { ValveClosedError } from '../faucets/valve-closed.error.js';
import { whenClosed } from '../faucets/with-valve.js';
import { Sink } from '../sink.js';

export function createSink<T>(
  resolve: () => void,
  reject: (reason: unknown) => void,
  sink: Sink<T>,
): Sink<T> {
  let sinkCount = 0;
  let isClosed = Valve$isOpen;

  return async (value: T) => {
    whenClosed(reason => {
      if (reason === undefined) {
        isClosed = Valve$isClosed;

        if (!sinkCount) {
          resolve();
        }
      } else {
        const error = Valve$error(reason);

        isClosed = () => {
          throw error;
        };

        reject(error);
      }
    });

    if (isClosed()) {
      return;
    }

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

function Valve$isOpen(): boolean {
  return false;
}

function Valve$isClosed(): boolean {
  return true;
}

function Valve$error(cause: unknown): unknown {
  return typeof cause === 'string'
    ? new ValveClosedError(cause)
    : new ValveClosedError(undefined, { cause });
}

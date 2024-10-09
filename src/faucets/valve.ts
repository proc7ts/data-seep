import { sinkOnce } from '../impl/sink-once.js';
import { Sink } from '../sink.js';

/**
 * Valve allows to explicitly {@link close} the flow of data poured from {@link Faucet faucet} to particular
 * {@link Sink sink}.
 *
 * Valve created by {@link withValve} faucet. Once created it can be used either immediately or somewhere downstream.
 *
 * Current valve is available via {@link whenClosed} function in synchronous part of {@link withValve} sink.
 */
export interface Valve {
  /**
   * Closes the valve, either normally or abruptly.
   *
   * This would signal the faucet to stop pouring the data. The data processing of data sank previously not necessarily
   * terminated.
   *
   * When `reason` specified, the valve is closed abruptly. This causes any attempt to sink more data to throw a
   * {@link ValveClosedError} instead of silently ignoring it.
   *
   * Calling this method again has no effect.
   *
   * @param reason - A reason to close the valve. When specified and not `undefined`, the valve is closed abruptly.
   */
  close(reason?: unknown): void;

  /**
   * Calls the given `callback` function when the valve closed.
   *
   * If the valve is closed already, then calls the `callback` immediately.
   *
   * @param callback - Function to call once this valve is closed.
   */
  whenClosed(callback: ValveCallback): void;

  /**
   * Pours this valve to the given `sink`.
   *
   * If there is a current valve, then makes this one depend on it. I.e. once that valve is closed, this one would be
   * closed with the same reason.
   *
   * Make the valve _current_ for the synchronous part of the `sink`.
   *
   * @param sink - Target sink.
   *
   * @returns Promise resolved when valve sank.
   */
  withValve(sink: Sink<Valve>): Promise<void>;
}

/**
 * Function called once a valve is {@link Valve#close closed}.
 *
 * @param reason - Reason why the value has been closed.
 *
 * Either `undefined` if the value has been closed normally, or the reason passed to the
 * {@link Valve#close close} method if the value has been closed abruptly.
 */
export type ValveCallback = (this: void, reason: unknown) => void;

/**
 * Creates new valve and pours it to the given `sink`.
 *
 * If there is a current valve, then makes new one depend on it. I.e. once that valve is closed, the new one would be
 * closed with the same reason.
 *
 * Make the valve _current_ for the synchronous part of the `sink`.
 *
 * Calls {@link Valve#withValve} internally.
 *
 * @param sink - Target sink.
 *
 * @returns Promise resolved when valve sank.
 */
export async function withValve(sink: Sink<Valve>): Promise<void> {
  await new ValveHandle().withValve(sink);
}

/**
 * Calls the given `callback` function when _current_ valve closed.
 *
 * If the valve is closed already, then calls the `callback` immediately.
 *
 * Does nothing if there is no current valve.
 *
 * Calls {@link Valve#whenClosed} method of current sink internally.
 *
 * @param callback - Function to call once this valve is closed.
 */
export function whenClosed(callback: ValveCallback): void {
  currentValve?.whenClosed(callback);
}

class ValveHandle implements Valve {
  #closed = false;
  #reason?: unknown;
  readonly #callbacks: ((reason: unknown) => void)[] = [];

  whenClosed(callback: (reason: unknown) => void): void {
    if (this.#closed) {
      callback(this.#reason);
    } else {
      this.#callbacks.push(callback);
    }
  }

  close(reason: unknown): void {
    if (!this.#closed) {
      this.#closed = true;
      this.#reason = reason;
      for (const callback of this.#callbacks) {
        try {
          callback(reason);
        } catch (error) {
          console.warn('Error while closing valve:', error);
        }
      }

      this.#callbacks.length = 0;
    }
  }

  withValve(sink: Sink<Valve>): Promise<void> {
    const prevValve = currentValve;

    prevValve?.whenClosed(this.close.bind(this));
    currentValve = this;

    try {
      return sinkOnce(sink, this);
    } finally {
      currentValve = prevValve;
    }
  }
}

let currentValve: ValveHandle | undefined;

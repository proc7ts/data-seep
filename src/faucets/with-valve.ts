import { sinkOnce } from '../impl/sink-once.js';
import { Sink } from '../sink.js';

export interface Valve {
  whenClosed(callback: (this: void, reason: unknown) => void): void;
  close(reason?: unknown): void;
  withValve(sink: Sink<Valve>): Promise<void>;
}

export async function withValve(sink: Sink<Valve>): Promise<void> {
  await new ValveHandle().withValve(sink);
}

export function whenClosed(callback: (this: void, reason: unknown) => void): void {
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
      this.#callbacks.push(reason => {
        try {
          callback(reason);
        } catch (error) {
          console.warn('Error while closing valve:', error);
        }
      });
    }
  }

  close(reason: unknown): void {
    if (!this.#closed) {
      this.#closed = true;
      this.#reason = reason;
      for (const listener of this.#callbacks) {
        listener(reason);
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

import { sinkOnce } from '../impl/sink-once.js';
import { Sink } from '../sink.js';

export function withValve(sink: Sink<(reason?: unknown) => void>): Promise<void> {
  const valve = new Valve();

  try {
    return sinkOnce(sink, reason => {
      valve.close(reason);
    });
  } finally {
    valve.done();
  }
}

export function whenClosed(callback: (this: void, reason: unknown) => void): void {
  currentValve?.whenClosed(callback);
}

class Valve {

  readonly #prev: Valve | undefined;
  #closed = false;
  #reason?: unknown;
  readonly #callbacks: ((reason: unknown) => void)[] = [];

  constructor() {
    this.#prev = currentValve;
    if (currentValve) {
      currentValve.whenClosed(this.close.bind(this));
    }
    currentValve = this;
  }

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

  done(): void {
    currentValve = this.#prev;
  }

}

let currentValve: Valve | undefined;

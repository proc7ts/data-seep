import { noop } from '@proc7ts/primitives';
import { Supply } from '@proc7ts/supply';
import { DataSink } from '../data-sink.js';
import { DataJoint } from './data-joint.js';

/**
 * In addition to connecting {@link DataSink data sink} with {@link DataFaucet data faucet}, the buffer joint also
 * buffers the latest values, and pours them to newly {@link BufferJoint#sinkAdded added} data sinks.
 *
 * Note that the sinking won't complete until the value droped from buffer or joint supply cut off.
 *
 * @typeParam T - Type of data values poured by {@link DataJoint#faucet joint faucet}.
 * @typeParam TIn - Type of data values accepted by {@link DataJoint#sink joint sink}.
 */
export class BufferJoint<out T, in TIn extends T = T>
  extends DataJoint<T, TIn>
  implements Iterable<T> {

  #buffer: BufferJoint.Buffer<T>;

  /**
   * Constructs buffer joint.
   *
   * @param buffer - Either buffer to use, a maximum buffer capacity, or nothing for infinite buffer size. Minimum 0.
   */
  constructor(buffer?: BufferJoint.Buffer<T> | number) {
    super();

    if (buffer == null) {
      this.#buffer = new BufferJoint$InfiniteBuffer();
    } else if (typeof buffer === 'number') {
      const capacity = Math.max(0, buffer);

      if (!Number.isFinite(capacity)) {
        this.#buffer = new BufferJoint$InfiniteBuffer();
      } else if (capacity < 1) {
        this.#buffer = BufferJoint$EmptyBuffer;
      } else {
        this.#buffer = new BufferJoint$CyclicBuffer(buffer);
      }
    } else {
      this.#buffer = buffer;
    }

    this.supply.whenOff(() => {
      this.#buffer.clear();
      this.#buffer = BufferJoint$EmptyBuffer;
    });
  }

  [Symbol.iterator](): IterableIterator<T> {
    return this.values();
  }

  /**
   * Iterates over buffered values.
   *
   * @returns Iterable iterator of buffered values.
   */
  values(): IterableIterator<T> {
    return this.#buffer[Symbol.iterator]();
  }

  /**
   * Called when new data value accepted by {@link sink joint sink}.
   *
   * Buffers `value` by default.
   *
   * @param value - Accepted data value.
   *
   * @returns Promise resolved when the value removed from the buffer, or {@link supply joint supply} cut off.
   */
  protected override valueAccepted(value: TIn): Promise<void> {
    return new Promise(resolve => this.#buffer.add(value, resolve));
  }

  /**
   * Called when new data sink accepted by {@link faucet joint faucet}, right after the sink is actually added to the
   * joint.
   *
   * Pours all buffered values to the added `sink`.
   *
   * @param sink - Added data sink.
   * @param _sinkSupply - Added data sink supply. When cut off the data won't be poured to target `sink`.
   *
   * @returns Either nothing, or a promise-like instance resolved when the sink added.
   */
  protected override async sinkAdded(sink: DataSink<T>, _sinkSupply: Supply<void>): Promise<void> {
    await Promise.all([...this.#buffer].map(async value => await sink(value)));
  }

}

export namespace BufferJoint {
  /**
   * Buffer implementation to use by {@link BufferJoint:class BufferJoint}.
   *
   * @typeParam T - Type of buffered values.
   */
  export interface Buffer<T> extends Iterable<T> {
    /**
     * Adds entry to the buffer.
     *
     * @param value - Entry to buffer.
     * @param drop - Function to call when the value droppped from the buffer.
     */
    add(value: T, drop: () => void): void;

    /**
     * Clears the buffer.
     */
    clear(): void;

    /**
     * Iterates over buffered values.
     */
    [Symbol.iterator](): IterableIterator<T>;
  }
}

const BufferJoint$EmptyBuffer: BufferJoint.Buffer<never> = {
  add(_value, drop) {
    drop();
  },
  clear: noop,
  [Symbol.iterator]() {
    return [][Symbol.iterator]();
  },
};

class BufferJoint$InfiniteBuffer<T> implements BufferJoint.Buffer<T> {

  #entries: BufferJoint$Entry<T>[] = [];

  add(value: T, drop: () => void): void {
    this.#entries.push({ value, drop });
  }

  clear(): void {
    this.#entries.forEach(({ drop }) => drop());
    this.#entries.length = 0;
  }

  *[Symbol.iterator](): IterableIterator<T> {
    for (const { value } of this.#entries) {
      yield value;
    }
  }

}

class BufferJoint$CyclicBuffer<T> implements BufferJoint.Buffer<T> {

  readonly #capacity: number;
  readonly #entries: BufferJoint$Entry<T>[] = [];
  #head = 0;
  #tail = 0;
  #size = 0;

  constructor(capacity: number) {
    this.#capacity = capacity;
    this.#entries = new Array(capacity);
  }

  add(value: T, drop: () => void): void {
    const index = this.#tail;

    if (++this.#tail >= this.#capacity) {
      this.#tail = 0;
    }
    if (++this.#size > this.#capacity) {
      this.#size = this.#capacity;
      if (++this.#head >= this.#capacity) {
        this.#head = 0;
      }
    }

    const prevEntry = this.#entries[index];

    this.#entries[index] = { value, drop };

    prevEntry?.drop();
  }

  clear(): void {
    for (const { drop } of this.#iterate()) {
      drop();
    }
    this.#entries.length = 0;
  }

  *#iterate(): IterableIterator<BufferJoint$Entry<T>> {
    let index = this.#head;

    for (let size = this.#size; size > 0; --size) {
      yield this.#entries[index];
      if (++index >= this.#capacity) {
        index = 0;
      }
    }
  }

  *[Symbol.iterator](): IterableIterator<T> {
    for (const { value } of this.#iterate()) {
      yield value;
    }
  }

}

interface BufferJoint$Entry<T> {
  readonly value: T;
  readonly drop: (this: void) => void;
}

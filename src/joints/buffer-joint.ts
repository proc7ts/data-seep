import { noop } from '@proc7ts/primitives';
import { Supply } from '@proc7ts/supply';
import { DataSink } from '../data-sink.js';
import { DataJoint } from './data-joint.js';

/**
 * In addition to connecting {@link DataSink data sink} with {@link DataFaucet data faucet}, the buffer joint also
 * buffers the latest values, and pours them to newly {@link BufferJoint#addSink added} data sinks.
 *
 * @typeParam T - Type of data values poured by {@link DataJoint#faucet joint faucet}.
 * @typeParam TIn - Type of data values accepted by {@link DataJoint#sink joint sink}.
 */
export class BufferJoint<out T, in TIn extends T = T>
  extends DataJoint<T, TIn>
  implements Iterable<T> {

  readonly #buffer: BufferJoint.Buffer<T>;

  /**
   * Constructs buffer joint.
   *
   * @param buffer - Either buffer to use, a maximum buffer capacity, or nothing for infinite buffer size. Minimum 0.
   */
  constructor(buffer?: BufferJoint.Buffer<T> | number) {
    super();
    if (buffer == null) {
      this.#buffer = [];
    } else if (typeof buffer === 'number') {
      const capacity = Math.max(0, buffer);

      if (!Number.isFinite(capacity)) {
        this.#buffer = [];
      } else if (capacity < 1) {
        this.#buffer = BufferJoint$EmptyBuffer;
      } else {
        this.#buffer = new BufferJoint$CyclicBuffer(buffer);
      }
    } else {
      this.#buffer = buffer;
    }
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
   * Called when new data value accepted by {@link sink joint sink} right before being actually sank to sinks
   * {@link addSink added} to this joint.
   *
   * The value won't be sank if this method call failed.
   *
   * Buffers `value` by default.
   *
   * @param value - Accepted data value.
   *
   * @returns Ether nothing, or a promise-like instance resolved when the value accepted.
   */
  protected override accept(value: TIn): void | PromiseLike<unknown> {
    this.#buffer.push(value);
  }

  /**
   * Called when new data sink accepted by {@link faucet joint faucet} right before the sink is actually added to the
   * joint.
   *
   * The sink won't be added to the joint if this method call failed.
   *
   * Pours all buffered values to the added `sink`.
   *
   * @param sink - Added data sink.
   * @param _sinkSupply - Added data sink supply. When cut off the data won't be poured to target `sink`.
   *
   * @returns Either nothing, or a promise-like instance resolved when the sink added.
   */
  protected override async addSink(sink: DataSink<T>, _sinkSupply: Supply<void>): Promise<void> {
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
    push(value: T): void;
    [Symbol.iterator](): IterableIterator<T>;
  }
}

const BufferJoint$EmptyBuffer: BufferJoint.Buffer<never> = {
  push: noop,
  [Symbol.iterator]: () => [][Symbol.iterator](),
};

class BufferJoint$CyclicBuffer<T> implements BufferJoint.Buffer<T> {

  readonly #capacity: number;
  readonly #values: T[] = [];
  #head = 0;
  #tail = 0;
  #size = 0;

  constructor(capacity: number) {
    this.#capacity = capacity;
    this.#values = new Array(capacity);
  }

  push(value: T): void {
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

    this.#values[index] = value;
  }

  *[Symbol.iterator](): IterableIterator<T> {
    let index = this.#head;

    for (let size = this.#size; size > 0; --size) {
      yield this.#values[index];
      if (++index >= this.#capacity) {
        index = 0;
      }
    }
  }

}

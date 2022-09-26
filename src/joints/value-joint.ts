import { Supply } from '@proc7ts/supply';
import { DataSink } from '../data-sink.js';
import { DataJoint } from './data-joint.js';

/**
 * In addition to connecting {@link DataSink data sink} with {@link DataFaucet data faucet}, the value joint also
 * preserves the latest value, and pours it to newly {@link ValueJoint#addSink added} data sinks.
 *
 * The data sank to the {@link ValueJoint#sink sink} is poured to the {@link ValueJoint#faucet faucet}.
 *
 * @typeParam T - Type of data values poured by {@link DataJoint#faucet joint faucet}.
 * @typeParam TIn - Type of data values accepted by {@link DataJoint#sink joint sink}.
 */
export class ValueJoint<out T, in TIn extends T = T> extends DataJoint<T, TIn> {

  #value: T;

  /**
   * Contructs value joint.
   *
   * @param value - Initial value to sink to the added sinks until a new one accepted.
   */
  constructor(value: T) {
    super();
    this.#value = value;
  }

  /**
   * The last value accepted by this joint, or initial one if no values accepted yet.
   */
  get value(): T {
    return this.#value;
  }

  /**
   * Called when new data value accepted by {@link sink joint sink} right before being actually sank to sinks
   * {@link addSink added} to this joint.
   *
   * The value won't be sank if this method call failed.
   *
   * Updates {@link value current value} by default.
   *
   * @param value - Accepted data value.
   *
   * @returns Ether nothing, or a promise-like instance resolved when the value accepted.
   */
  protected override accept(value: TIn): void | PromiseLike<unknown> {
    this.#value = value;
  }

  /**
   * Called when new data sink accepted by {@link faucet joint faucet} right before the sink is actually added to the
   * joint.
   *
   * The sink won't be added to the joint if this method call failed.
   *
   * Pours {@link value current value} to the added `sink`.
   *
   * @param _sink - Added data sink.
   * @param _sinkSupply - Added data sink supply. When cut off the data won't be poured to target `sink`.
   *
   * @returns Either nothing, or a promise-like instance resolved when the sink added.
   */
  protected async addSink(sink: DataSink<T>, _sinkSupply: Supply<void>): Promise<void> {
    await sink(this.value);
  }

}

import { Supply } from '@proc7ts/supply';
import { DataSink } from '../data-sink.js';
import { DataJoint } from './data-joint.js';

/**
 * In addition to connecting {@link DataSink data sink} with {@link DataFaucet data faucet}, the value joint also
 * preserves the latest value, and pours it to newly {@link ValueJoint#sinkAdded added} data sinks.
 *
 * Note that the sinking won't complete until another value poured to the joint or joint supply cut off.
 *
 * @typeParam T - Type of data values poured by {@link DataJoint#faucet joint faucet}.
 * @typeParam TIn - Type of data values accepted by {@link DataJoint#sink joint sink}.
 */
export class ValueJoint<out T, in TIn extends T = T> extends DataJoint<T, TIn> {

  #value: T;
  #dropValue?: () => void;

  /**
   * Contructs value joint.
   *
   * @param value - Initial value to sink to the added sinks until a new one accepted.
   */
  constructor(value: T) {
    super();
    this.#value = value;
    this.supply.whenOff(() => {
      this.#value = value;
      this.#dropValue?.();
    });
  }

  /**
   * The last value accepted by this joint, or initial one if no values accepted yet.
   *
   * Reset to initial one once the {@link supply joint supply} cut off.
   */
  get value(): T {
    return this.#value;
  }

  /**
   * Called when new data value accepted by {@link sink joint sink}.
   *
   * Updates {@link value current value} by default.
   *
   * @param value - Accepted data value.
   *
   * @returns Promise resolved when the value replaced with another one, or {@link supply join supply} cut off.
   */
  protected override acceptValue(value: TIn): Promise<void> {
    return new Promise<void>(resolve => {
      const dropPrevValue = this.#dropValue;

      this.#value = value;
      this.#dropValue = resolve;

      dropPrevValue?.();
    });
  }

  /**
   * Called when new data sink accepted by {@link faucet joint faucet}, right after the sink is actually added to the
   * joint.
   *
   * Pours {@link value current value} to the added `sink`.
   *
   * @param sink - Added data sink.
   * @param _sinkSupply - Added data sink supply. When cut off the data won't be poured to target `sink`.
   *
   * @returns Either nothing, or a promise-like instance resolved when the sink added.
   */
  protected async sinkAdded(sink: DataSink<T>, _sinkSupply: Supply<void>): Promise<void> {
    await sink(this.value);
  }

}

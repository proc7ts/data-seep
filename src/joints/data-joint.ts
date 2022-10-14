import { PromiseResolver } from '@proc7ts/async';
import { noop } from '@proc7ts/primitives';
import { Supply, SupplyOut } from '@proc7ts/supply';
import { DataFaucet } from '../data-faucet.js';
import { DataSink } from '../data-sink.js';
import { sinkAll } from '../sink-all.js';

/**
 * Data joint connects {@link DataSink data sink} with {@link DataFaucet data faucet}.
 *
 * The data sank to the {@link DataJoint#sink sink} is poured to the {@link DataJoint#faucet faucet}.
 *
 * @typeParam T - Type of data values poured by {@link DataJoint#faucet joint faucet}.
 * @typeParam TIn - Type of data values accepted by {@link DataJoint#sink joint sink}.
 */
export class DataJoint<out T, in TIn extends T = T> {

  readonly #supply = new Supply();
  readonly #sink: DataSink<TIn>;
  readonly #faucet: DataFaucet<T>;
  readonly #sinks = new Map<Supply, DataSink<TIn>>();

  /**
   * Constructs data joint.
   */
  constructor() {
    this.#sink = this.#pour.bind(this);

    const faucet = this.#addSink.bind(this);

    this.#faucet = async (sink, sinkSupply) => await sinkAll(
        faucet,
        sink,
        sinkSupply ? sinkSupply.derive().needs(this.supply) : this.supply,
      );
  }

  async #pour(value: TIn): Promise<void> {
    const { whenAccepted, whenSank } = this.pass(value);

    await Promise.all([whenAccepted?.(), whenSank()]);
  }

  async #addSink(sink: DataSink<T>, sinkSupply: SupplyOut): Promise<void> {
    const supply = new Supply();

    supply
      .whenOff(() => {
        this.#sinks.delete(supply);
      })
      .needs(sinkSupply);

    if (supply.isOff) {
      return await supply.whenDone();
    }

    this.#sinks.set(supply, sink);
    await Promise.all([
      (async () => {
        await this.sinkAdded(sink, supply);
      })(),
      supply.whenDone(),
    ]);
  }

  /**
   * Joint supply.
   *
   * When cut off the joint stops functioning.
   */
  get supply(): Supply {
    return this.#supply;
  }

  /**
   * Data sink accepting data values then poured by {@link faucet joint faucet} to all sinks {@link sinkAdded added}
   * to this joint.
   */
  get sink(): DataSink<TIn> {
    return this.#sink;
  }

  /**
   * Data foucet pouring data values sank to {@link sink joint sink}.
   */
  get faucet(): DataFaucet<T> {
    return this.#faucet;
  }

  /**
   * Passes value through this joint.
   *
   * @param value - Value to pass.
   *
   * @returns State of value passage.
   */
  pass(value: TIn): DataJoint.Passage {
    const { supply } = this;

    if (supply.isOff) {
      const whenSank = async (): Promise<void> => await supply.whenDone();

      return { whenAccepted: whenSank, whenSank };
    }

    return {
      whenAccepted: this.#acceptValue(value),
      whenSank: this.#pourValue(value),
    };
  }

  #acceptValue(value: TIn): (() => Promise<void>) | undefined {
    const whenAccepted = this.acceptValue(value);

    if (!whenAccepted) {
      return;
    }

    const valueAccepted = new PromiseResolver();

    valueAccepted.resolve(Promise.resolve(whenAccepted).then(noop));

    return async () => await valueAccepted.whenDone();
  }

  #pourValue(value: TIn): () => Promise<void> {
    const valueSank = new PromiseResolver();
    const whenSank = Promise.all(
      [...this.#sinks.entries()].map(async ([supply, sink]) => {
        try {
          await sink(value);
        } catch (error) {
          supply.fail(error);
          throw error;
        }
      }),
    );

    valueSank.resolve(whenSank.then(noop));

    return async () => await valueSank.whenDone();
  }

  /**
   * Called when new data value {@link pass added} to accept the new value.
   *
   * Does nothing by default.
   *
   * @param _value - Accepted data value.
   *
   * @returns Ether nothing if the value accepted immediately, or a promise-like instance resolved when the value
   * accepted.
   */
  protected acceptValue(_value: TIn): void | PromiseLike<unknown> {
    // Do nothing.
  }

  /**
   * Called when new data sink accepted by {@link faucet joint faucet}, right after the sink is actually added to the
   * joint.
   *
   * Does nothing by default.
   *
   * @param _sink - Added data sink.
   * @param _sinkSupply - Added data sink supply. When cut off the data won't be poured to target `sink`.
   *
   * @returns Either nothing, or a promise-like instance resolved when the sink added.
   */
  protected sinkAdded(_sink: DataSink<T>, _sinkSupply: Supply): void | PromiseLike<unknown> {
    // Do nothing.
  }

}

export namespace DataJoint {
  /**
   * State of value {@link DataJoint#pass passage} through the joint.
   *
   * May be used to await for value acceptance.
   */
  export interface Passage {
    /**
     * Waits for the passed value to be {@link DataJoint#acceptValue accepted}.
     *
     * The absence means, the value accepted immediately.
     *
     * @returns Promise resolved when value accepted.
     */
    whenAccepted?(this: void): Promise<void>;

    /**
     * Waits for the passed value to be sank by data sinks {@link DataJoint#sinkAdded added} to the joint.
     *
     * @returns Promise resolved when value sank.
     */
    whenSank(this: void): Promise<void>;
  }
}

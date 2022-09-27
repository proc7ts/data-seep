import { Supply, SupplyOut } from '@proc7ts/supply';
import { DataFaucet } from '../data-faucet.js';
import { DataSink } from '../data-sink.js';

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
    this.#faucet = this.#addSink.bind(this);
  }

  async #pour(value: TIn): Promise<void> {
    const { supply } = this;

    if (supply.isOff) {
      return await supply.whenDone();
    }

    await Promise.all([
      this.valueAccepted(value),
      ...[...this.#sinks.values()].map(async sink => await sink(value)),
    ]);
  }

  async #addSink(sink: DataSink<T>, sinkSupply?: SupplyOut): Promise<void> {
    const supply = new Supply();

    supply
      .whenOff(() => {
        this.#sinks.delete(supply);
      })
      .needs(this.supply);

    sinkSupply?.alsoOff(supply);

    if (supply.isOff) {
      return await supply.whenDone();
    }

    this.#sinks.set(supply, sink);
    await this.sinkAdded(sink, supply);
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
   * Called when new data value accepted by {@link sink joint sink}.
   *
   * Does nothing by default.
   *
   * @param _value - Accepted data value.
   *
   * @returns Ether nothing, or a promise-like instance resolved when the value accepted.
   */
  protected valueAccepted(_value: TIn): void | PromiseLike<unknown> {
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

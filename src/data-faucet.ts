import { SupplyOut } from '@proc7ts/supply';
import { DataSink } from './data-sink.js';

/**
 * A data faucet is a function that generates some data and pours it into {@link DataSink data sink} function as the
 * first argument of the latter. When the data sank it may be invalidated, as it is illegal to use this data outside
 * the target `sink`.
 *
 * A faucet may pour the data to target `sink` any number of times, either sequentially or in parallel to each other.
 *
 * @typeParam T - Poured data type.
 * @param sink - Target data sink.
 * @param sinkSupply - Optional data `sink` supply. When cut off the data should not be poured to target `sink`.
 *
 * @returns Promise resolved when all data poured and sank.
 */
export type DataFaucet<out T> = (sink: DataSink<T>, sinkSupply?: SupplyOut) => Promise<void>;

/**
 * An intake {@link DataFaucet data facet} that always receives a sink supply.
 *
 * @typeParam T - Poured data type.
 * @param sink - Target data sink.
 * @param sinkSupply - Data `sink` supply. When cut off the data should not be poured to target `sink`.
 *
 * @returns Promise resolved when all data poured and sank.
 */
export type IntakeFaucet<out T> = (sink: DataSink<T>, sinkSupply: SupplyOut) => Promise<void>;

export namespace DataFaucet {
  /**
   * Type of data poured by faucets of the given type.
   *
   * @typeParam TFaucet - Data faucet type.
   */
  export type SeepType<TFaucet extends IntakeFaucet<unknown>> = TFaucet extends (
    sink: DataSink<infer T>,
  ) => Promise<void>
    ? T
    : never;
}

import { SupplyOut } from '@proc7ts/supply';
import { DataSink } from './data-sink.js';

/**
 * Data faucet is a function that generates some data and pours data values to {@link DataSink data sink} function
 * as the first argument of the latter. When the value sank it may be invalidated. Generally, it is illegal to use
 * data values outside the target `sink`.
 *
 * Data faucet may pour data values to target `sink` any number of times, either sequentially or in parallel to each
 * other.
 *
 * @typeParam T - Poured data type.
 * @param sink - Target data sink.
 * @param sinkSupply - Optional data `sink` supply. Once cut off the data no longer poured to target `sink`.
 *
 * @returns Promise resolved when all data poured and sank.
 */
export type DataFaucet<out T> = (sink: DataSink<T>, sinkSupply?: SupplyOut) => Promise<void>;

/**
 * Intake {@link DataFaucet data facet} that always receives a sink supply.
 *
 * @typeParam T - Poured data type.
 * @param sink - Target data sink.
 * @param sinkSupply - Data `sink` supply.  Once cut off the data no longer poured to target `sink`.
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

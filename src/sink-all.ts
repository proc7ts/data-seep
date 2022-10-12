import { PromiseResolver } from '@proc7ts/async';
import { Supply, SupplyOut } from '@proc7ts/supply';
import { IntakeFaucet } from './data-faucet.js';
import { DataSink } from './data-sink.js';

/**
 * Sinks all data poured by the given raw faucet.
 *
 * Raw faucet may resolve before all data sank. This function ensures that the returned promise resolved only when all
 * data sank.
 *
 * This function can be used to implement fully conformant data faucets.
 *
 * @typeParam T - Type of data values to sink.
 * @param rawFaucet - Raw faucet to sink data from.
 * @param sink - Poured data sink.
 * @param sinkSupply - Optional data `sink` supply. Once cut off the data no longer poured to target `sink`.
 *
 * @returns Promise resolved when all data sank.
 */
export async function sinkAll<T>(
  rawFaucet: IntakeFaucet<T>,
  sink: DataSink<T>,
  sinkSupply: SupplyOut = new Supply(),
): Promise<void> {
  sink = DataSink(sink, sinkSupply);

  const allSank = new PromiseResolver();
  let numSinking = 0;
  const checkAllSank = (): void => {
    if (!numSinking) {
      allSank.resolve();
    }
  };

  const sinkValue = async (value: T): Promise<void> => {
    ++numSinking;
    try {
      await sink(value);
    } finally {
      --numSinking;
      checkAllSank();
    }
  };

  await rawFaucet(sinkValue, sinkSupply);

  checkAllSank();

  return await allSank.whenDone();
}

import { Supply } from '@proc7ts/supply';
import { DataSink } from './data-sink.js';

/**
 * Sinks arbitrary value according to {@link DataFaucet data faucet} processing rules.
 *
 * An utility utilized to implement data faucets.
 *
 * @typeParam T - Type of data values to sink.
 * @param value - Data value to sink.
 * @param sink - Target data sink.
 * @param sinkSupply - Optional data `sink` supply. When cut off the data should not be poured to target `sink`.
 *
 * @returns Promise resolved when data sank.
 */
export async function sinkValue<T>(
  value: T | PromiseLike<T>,
  sink: DataSink<T>,
  sinkSupply: Supply = new Supply(),
): Promise<void> {
  if (sinkSupply.isOff) {
    return await sinkSupply.whenDone();
  }

  const whenSank = async (): Promise<void> => {
    const dataSupply = new Supply();

    sinkSupply.whenOff(() => {
      // Do not fail data supply when sink supply failed.
      // Just cut it off.
      dataSupply.off();
    });

    const whenDone = dataSupply.whenDone();
    const supplier = await sink(await value, dataSupply);

    if (supplier) {
      dataSupply.needs(supplier);
    } else {
      dataSupply.off();
    }

    return await whenDone;
  };

  return await Promise.race([sinkSupply.whenDone(), whenSank()]);
}

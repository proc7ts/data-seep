import { Supply } from '@proc7ts/supply';
import { DataSink } from './data-sink.js';

export async function sinkValue<T>(
    value: T | PromiseLike<T>,
    sink: DataSink<T>,
    supply: Supply = new Supply(),
): Promise<void> {
  const whenReturned = async (): Promise<void> => {

    const supplier = await sink(await value, supply);

    if (supplier) {
      supply.needs(supplier);
    } else {
      supply.off();
    }

    return supply.whenDone();
  };

  await Promise.race([
    supply.whenDone(),
    whenReturned(),
  ]);
}

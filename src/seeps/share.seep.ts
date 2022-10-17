import { neverSupply, Supply, SupplyOut } from '@proc7ts/supply';
import { DataFaucet, IntakeFaucet } from '../data-faucet.js';
import { DataSeep } from '../data-seep.js';
import { DataSink } from '../data-sink.js';

/**
 * Creates data seep that shares input values among all sinks.
 *
 * Once the first sink passed to resulting faucet, the seep starts sinking input data and passed it to that sink.
 * All subsequent sinks receive the same value. Once all sinks removed, the input sinking stops.
 *
 * @typeParam T - Type of shared values.
 *
 * @returns New data seep.
 */
export function shareSeep<T>(): DataSeep<T> {
  return sharingSeep;
}

function sharingSeep<T>(input: IntakeFaucet<T>): DataFaucet<T> {
  const sinks = new Map<Supply, DataSink<T>>();
  let outputSupply = neverSupply();
  const sinkInput = async (value: T): Promise<void> => {
    await Promise.all([...sinks.values()].map(async sink => await sink(value)));
  };
  const removeSink = (supply: Supply): void => {
    sinks.delete(supply);
    if (!sinks.size) {
      outputSupply.done();
    }
  };

  return async (sink: DataSink<T>, sinkSupply: SupplyOut = new Supply()): Promise<void> => {
    const supply = new Supply();

    supply.whenOff(() => removeSink(supply));
    sinkSupply.alsoOff(supply);

    if (!supply.isOff) {
      const isFirstSink = !sinks.size;

      sinks.set(supply, sink);

      if (isFirstSink) {
        outputSupply = new Supply(() => {
          outputSupply = neverSupply();
        });

        input(sinkInput, outputSupply)
          .then(() => {
            outputSupply.done();
          })
          .catch(error => outputSupply.fail(error));
      }

      outputSupply.alsoOff(supply);
    }

    await supply.whenDone();
  };
}

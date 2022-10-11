import { Supply } from '@proc7ts/supply';
import { DataFaucet, IntakeFaucet } from '../data-faucet.js';
import { DataSeep } from '../data-seep.js';
import { DataSink } from '../data-sink.js';

/**
 * Creates data seep that pours input data when it becomes available. Until then it pours the data by default faucet.
 *
 * @typeParam T - Poured data type.
 * @param withDefault - Default data faucet.
 *
 * @returns New data seep.
 */
export function orSeep<T>(withDefault: DataFaucet<T>): DataSeep<T> {
  return (faucet: IntakeFaucet<T>) => async (sink, sinkSupply = new Supply()) => {
      const defaultSinkSupply = new Supply();
      const sinkDefault = DataSink(sink, defaultSinkSupply);

      sinkSupply.alsoOff(defaultSinkSupply);

      const sinkValue = DataSink(sink, sinkSupply);

      await Promise.all([
        faucet(value => {
          defaultSinkSupply.done();

          return sinkValue(value);
        }, sinkSupply),
        withDefault(async value => await sinkDefault(value), defaultSinkSupply),
      ]);
    };
}

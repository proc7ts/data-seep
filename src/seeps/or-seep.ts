import { Supply } from '@proc7ts/supply';
import { DataFaucet } from '../data-faucet.js';
import { DataSeep } from '../data-seep.js';

export function orSeep<T>(withDefault: DataFaucet<T>): DataSeep<T> {
  return (faucet: DataFaucet<T>) => async (sink, sinkSupply = new Supply()) => {
      let sinkDefault = async (value: T): Promise<void> => {
        if (!defaultSinkSupply.isOff) {
          await sink(value);
        }
      };
      const defaultSinkSupply = new Supply(() => {
        sinkDefault = () => Promise.resolve();
      }).needs(sinkSupply);

      const sinkValue = async (value: T): Promise<void> => {
        defaultSinkSupply.done();
        await sink(value);
      };

      await Promise.all([
        faucet(sinkValue, sinkSupply),
        withDefault(async value => await sinkDefault(value), defaultSinkSupply),
      ]);
    };
}

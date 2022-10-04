import { PromiseResolver } from '@proc7ts/async';
import { Supply } from '@proc7ts/supply';
import { DataFaucet } from '../data-faucet.js';
import { DataSeep } from '../data-seep.js';

export function orSeep<T>(withDefault: DataFaucet<T>): DataSeep<T> {
  return (faucet: DataFaucet<T>) => async (sink, sinkSupply = new Supply()) => {
      let nextDefaultAvailable: PromiseResolver | undefined;
      let sinkDefault = async (value: T): Promise<void> => {
        nextDefaultAvailable?.resolve();
        nextDefaultAvailable = new PromiseResolver();

        console.debug('recv default:', value);
        await sink(value);
        console.debug('sank default:', value);
        await nextDefaultAvailable.whenDone();
        console.debug('done default:', value);
      };
      const defaultSinkSupply = new Supply(() => {
        sinkDefault = () => Promise.resolve();
        nextDefaultAvailable?.resolve();
      }).needs(sinkSupply);

      const sinkValue = async (value: T): Promise<void> => {
        console.debug('recv value', value);
        defaultSinkSupply.done();
        await sink(value);
        console.debug('done value', value);
      };

      await Promise.all([
        faucet(async value => {
          console.debug('recv value', value);
          defaultSinkSupply.done();
          await sink(value);
          console.debug('done value', value);
        }, sinkSupply),
        withDefault(async value => await sinkDefault(value), defaultSinkSupply),
      ]);
    };
}

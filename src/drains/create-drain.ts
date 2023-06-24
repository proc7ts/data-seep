import { createSink } from '../impl/create-sink.js';
import { Sink } from '../sink.js';
import { Drain } from './drain.js';
import { inflowHandle } from './inflow.impl.js';

let drainNameSeq = 0;

/*#__NO_SIDE_EFFECTS__*/
export function createDrain<T, TArgs extends unknown[]>(
  open: (this: void, ...args: TArgs) => (sink: Sink<T>) => Promise<void>,
  openDefault: ((this: void) => (sink: Sink<T>) => Promise<void>) | false,
): Drain<T, TArgs>;

export function createDrain<T, TArgs extends unknown[] | []>(
  open: (this: void, ...args: TArgs) => (sink: Sink<T>) => Promise<void>,
): Drain<T, TArgs>;

export function createDrain<T, TArgs extends unknown[]>(
  open: (this: void, ...args: TArgs) => (sink: Sink<T>) => Promise<void>,
  openDefault?: ((this: void) => (sink: Sink<T>) => Promise<void>) | false,
): Drain<T, TArgs> {
  const { name } = open;
  const drainName = name || `#${++drainNameSeq}`;
  const key = Symbol(drainName);

  return {
    async [drainName](...args: [...TArgs, Sink<T>] | [Sink<T>]): Promise<void> {
      const inflow = inflowHandle()();
      let pour: (sink: Sink<T>) => Promise<void>;
      let sink: Sink<T>;

      if (args.length > 2) {
        // Arguments specified. Open the drain.
        inflow[key] = pour = open(...(args.slice(0, -1) as TArgs));
        sink = args[args.length - 1] as Sink<T>;
      } else {
        // No arguments.
        if (key in inflow) {
          // Reuse already opened drain.
          pour = inflow[key] as typeof pour;
        } else if (openDefault === false) {
          throw new TypeError(`Vat ${drainName} not started yet`);
        } else {
          // Opens the drain without arguments.
          inflow[key] = pour =
            openDefault?.() ?? (open as (this: void) => (sink: Sink<T>) => Promise<void>)();
        }

        sink = args[0] as Sink<T>;
      }

      let whenDone: Promise<void>;

      await Promise.all([
        new Promise<void>((resolve, reject) => {
          whenDone = pour(createSink(resolve, reject, sink));
        }),
        whenDone!,
      ]);
    },
  }[drainName];
}

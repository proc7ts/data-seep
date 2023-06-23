import { createSink } from '../impl/create-sink.js';
import { Sink } from '../sink.js';
import { inflowHandle } from './inflow.impl.js';
import { Refaucet } from './refaucet.js';

let refaucetNameSeq = 0;

/*#__NO_SIDE_EFFECTS__*/
export function createRefaucet<T, TArgs extends unknown[]>(
  start: (this: void, ...args: TArgs) => (sink: Sink<T>) => Promise<void>,
  startDefault: ((this: void) => (sink: Sink<T>) => Promise<void>) | false,
): Refaucet<T, TArgs>;

export function createRefaucet<T, TArgs extends unknown[] | []>(
  start: (this: void, ...args: TArgs) => (sink: Sink<T>) => Promise<void>,
): Refaucet<T, TArgs>;

export function createRefaucet<T, TArgs extends unknown[]>(
  start: (this: void, ...args: TArgs) => (sink: Sink<T>) => Promise<void>,
  startDefault?: ((this: void) => (sink: Sink<T>) => Promise<void>) | false,
): Refaucet<T, TArgs> {
  const { name } = start;
  const refaucetName = name || `#${++refaucetNameSeq}`;
  const key = Symbol(refaucetName);

  return {
    async [refaucetName](...args: [...TArgs, Sink<T>] | [Sink<T>]): Promise<void> {
      const inflow = inflowHandle()();
      let pour: (sink: Sink<T>) => Promise<void>;
      let sink: Sink<T>;

      if (args.length > 2) {
        // Faucet arguments specified.
        // Starting new faucet.
        inflow[key] = pour = start(...(args.slice(0, -1) as TArgs));
        sink = args[args.length - 1] as Sink<T>;
      } else {
        // No faucet arguments.
        if (key in inflow) {
          // Reuse started faucet.
          pour = inflow[key] as typeof pour;
        } else if (startDefault === false) {
          throw new TypeError(`Refaucet ${refaucetName} not started yet`);
        } else {
          // Start new no-args faucet.
          inflow[key] = pour =
            startDefault?.() ?? (start as (this: void) => (sink: Sink<T>) => Promise<void>)();
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
  }[refaucetName];
}

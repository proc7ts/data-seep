import { Faucet } from '../faucet.js';
import { createSink } from '../impl/create-sink.js';
import { Sink } from '../sink.js';
import { Drain } from './drain.js';
import { getInflow } from './inflow.impl.js';

let drainNameSeq = 0;

/*#__NO_SIDE_EFFECTS__*/
export function createDrain<T, TArgs extends unknown[]>(
  open: (this: void, ...args: TArgs) => Faucet<T>,
  openDefault: ((this: void) => Faucet<T>) | false,
): Drain<T, TArgs>;

export function createDrain<T, TArgs extends unknown[] | []>(
  open: (this: void, ...args: TArgs) => (sink: Sink<T>) => Promise<void>,
): Drain<T, TArgs>;

export function createDrain<T, TArgs extends unknown[]>(
  open: (this: void, ...args: TArgs) => Faucet<T>,
  openDefault?: ((this: void) => Faucet<T>) | false,
): Drain<T, TArgs> {
  const { name } = open;
  const drainName = name || `#${++drainNameSeq}`;
  const key = Symbol(drainName);

  return {
    async [drainName](...args: [...TArgs, Sink<T>] | [Sink<T>]): Promise<void> {
      const inflowData = getInflow().data();
      let ctl: DrainCtl<T>;
      let sink: Sink<T>;

      if (args.length > 2) {
        // Arguments specified. Open the drain.
        const pour = open(...(args.slice(0, -1) as TArgs));

        inflowData[key] = ctl = [pour, args.slice(0, -1)];

        sink = args[args.length - 1] as Sink<T>;
      } else {
        // No arguments.
        if (key in inflowData) {
          // Reuse already opened drain.
          ctl = inflowData[key] as typeof ctl;
        } else if (openDefault === false) {
          throw new TypeError(`Drain ${drainName} not opened yet`);
        } else {
          // Opens the drain without arguments.
          const pour =
            openDefault?.() ?? (open as (this: void) => (sink: Sink<T>) => Promise<void>)();

          inflowData[key] = ctl = [pour, []];
        }

        sink = args[0] as Sink<T>;
      }

      let whenDone: Promise<void>;

      await Promise.all([
        new Promise<void>((resolve, reject) => {
          whenDone = ctl[0](createSink(resolve, reject, sink));
        }),
        whenDone!,
      ]);
    },
  }[drainName];
}

type DrainCtl<T> = readonly [pour: Faucet<T>, args: unknown[]];

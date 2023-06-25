import { Faucet } from '../faucet.js';
import { createSink } from '../impl/create-sink.js';
import { InflowData, getInflow } from '../impl/inflow.js';
import { Sink } from '../sink.js';
import { Drain } from './drain.js';
import { withInflow } from './with-inflow.js';

let drainNameSeq = 0;

/**
 * Creates new {@link Drain}.
 *
 * @typeParam T - Poured data type.
 * @typeParam TArgs - Type of drain arguments.
 * @param open - Function that opens drain.
 * @param defaultOpen - Function that opens drain without arguments, or `false` to prohibit that.
 *
 * @returns New drain instance.
 */
export function createDrain<T, TArgs extends unknown[] = []>(
  open: DrainOpener<T, TArgs>,
  ...defaultOpen: DrainOpenerDefaults<T, TArgs>
): Drain<T, TArgs>;

/*#__NO_SIDE_EFFECTS__*/
export function createDrain<T, TArgs extends unknown[] = []>(
  open: DrainOpener<T, TArgs>,
  defaultOpen?: DrainOpener<T> | false,
): Drain<T, TArgs> {
  const { name } = open;
  const drainName = name || `#${++drainNameSeq}`;
  const key = Symbol(drainName);

  return {
    async [drainName](...args: [...TArgs, Sink<T>] | [Sink<T>]): Promise<void> {
      const inflow = getInflow();

      if (inflow) {
        await drain(inflow.data());
      } else {
        await withInflow(async () => {
          await drain(getInflow()!.data());
        });
      }

      async function drain(inflowData: InflowData): Promise<void> {
        if (args.length > 2) {
          // Arguments specified. Open the drain.
          await openDrain(
            inflowData,
            key,
            open,
            args.slice(0, -1) as TArgs,
            args[args.length - 1] as Sink<T>,
          );
        } else {
          // No arguments.
          const opened = inflowData[key];
          const sink = args[0] as Sink<T>;

          if (opened) {
            // Reuse already opened drain.
            await drainOnce(opened as DrainCtl<T>, sink);
          } else if (defaultOpen === false) {
            throw new TypeError(`Drain ${drainName} not opened yet`);
          } else {
            // Open no-args drain.
            await openDrain(inflowData, key, (defaultOpen ?? open) as () => Faucet<T>, [], sink);
          }
        }
      }
    },
  }[drainName];
}

/**
 * Function that opens a {@link createDrain drain}.
 *
 * @typeParam T - Poured data type.
 * @typeParam TArgs - Type of drain arguments.
 * @param args - Drain arguments.
 *
 * @returns Faucet that pours just opened drain data.
 */
export type DrainOpener<out T, in TArgs extends unknown[] = []> = (
  this: void,
  ...args: TArgs
) => Faucet<T>;

/**
 * Function that opens drain without arguments, or `false` to prohibit that.
 *
 * @typeParam T - Poured data type.
 * @typeParam TArgs - Type of drain arguments.
 */
export type DrainOpenerDefaults<T, TArgs extends unknown[]> = [] extends TArgs
  ? []
  : [DrainOpener<T> | false];

type DrainCtl<T> = readonly [pour: Faucet<T>, args: unknown[]];

async function openDrain<T, TArgs extends unknown[]>(
  inflowData: InflowData,
  key: symbol,
  open: (this: void, ...args: TArgs) => Faucet<T>,
  args: TArgs,
  sink: Sink<T>,
): Promise<void> {
  const pour = open(...args);
  const ctl: DrainCtl<T> = [pour, args];

  inflowData[key] = [pour, args.slice(0, -1)];
  try {
    await drainOnce(ctl, sink);
  } finally {
    inflowData[key] = null;
  }
}

async function drainOnce<T>([pour]: DrainCtl<T>, sink: Sink<T>): Promise<void> {
  let whenDone: Promise<void>;

  await Promise.all([
    new Promise<void>((resolve, reject) => {
      whenDone = pour(createSink(resolve, reject, sink));
    }),
    whenDone!,
  ]);
}

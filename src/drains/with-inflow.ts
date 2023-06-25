import { Faucet } from '../faucet.js';
import { getInflow, setInflow, startInflow } from '../impl/inflow.js';
import { sinkOnce } from '../impl/sink-once.js';
import { Sink } from '../sink.js';

/**
 * Starts inflow of {@link Drain drains}.
 *
 * Each drain opened within synchronous part of the given `sink` can pour data again downstream. For that, call
 * the drain without arguments within poured faucet's sink.
 *
 * @example
 * ```typescript
 * await withInflow(async withDrainInflow => {
 *   await withDrain(async initialValue => {
 *     // Sink the value poured by just opened drain.
 *     // ...some asynchronous code...
 *     await withDrainInflow(async () => {
 *       await withDrain(async nextValue => {
 *         // Sink the value from previously opened drain.
 *       });
 *     });
 *   });
 * });
 * ```
 *
 * Inflows could be nested within each other. The nested inflow inherits all drains opened in enclosing one.
 * It may override any of them, as well as open new ones.
 *
 * @param sink - The sink of no-args faucet that reproduces the inflow downstream.
 *
 * @returns Promise resolved when all data poured and sank.
 */
export async function withInflow(sink: Sink<Faucet<void>>): Promise<void>;

/**
 * Starts named inflow of {@link Drain drains}.
 *
 * @param name - Name of inflow used for debug.
 * @param sink - The sink of no-args faucet that reproduces the inflow downstream.
 *
 * @returns Promise resolved when all data poured and sank.
 */
export async function withInflow(name: string, sink: Sink<Faucet<void>>): Promise<void>;

export async function withInflow(
  nameOrSink: Sink<Faucet<void>> | string,
  sink?: Sink<Faucet<void>>,
): Promise<void> {
  let name: string | undefined;

  if (typeof nameOrSink === 'string') {
    name = nameOrSink;
  } else {
    sink = nameOrSink;
  }

  const baseInflow = getInflow();
  const inflow = startInflow(baseInflow, name);

  try {
    return sinkOnce(sink!, async (inflowSink: Sink<void>): Promise<void> => {
      const prevInflow = getInflow();

      setInflow(startInflow(inflow, name));

      try {
        return sinkOnce(inflowSink);
      } finally {
        setInflow(prevInflow);
      }
    });
  } finally {
    setInflow(baseInflow);
  }
}

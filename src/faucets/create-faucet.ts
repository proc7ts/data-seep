import { Faucet } from '../faucet.js';
import { createSink } from '../impl/create-sink.js';
import { Sink } from '../sink.js';

/**
 * Creates new {@link Faucet faucet}.
 *
 * Handles the {@link withValve valve} closing. Ensures that the returned promise resolves only when all data sank.
 *
 * @param pour - Pours the data to sink.
 *
 * @returns New faucet instance.
 */
export function createFaucet<T, TArgs extends unknown[] = []>(
  pour: Faucet<T, TArgs>,
): Faucet<T, TArgs> {
  const { name } = pour;
  const faucetName = name || `#${++faucetNameSeq}`;

  return {
    async [faucetName](...args: [...TArgs, Sink<T>]): Promise<void> {
      let whenDone: Promise<void>;

      await Promise.all([
        new Promise<void>((resolve, reject) => {
          whenDone = pour(
            ...(args.slice(0, -1) as TArgs),
            createSink(resolve, reject, args[args.length - 1] as Sink<T>),
          );
        }),
        whenDone!,
      ]);
    },
  }[faucetName];
}

let faucetNameSeq = 0;

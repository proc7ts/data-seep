import { noop } from '@proc7ts/primitives';
import { Supply } from '@proc7ts/supply';
import { DataFaucet, FaucetSeepType, IntakeFaucet } from './data-faucet.js';
import { DataSink } from './data-sink.js';
import { sinkValue } from './sink-value.js';

/**
 * Creates data faucet that pours record(s) with property values originated from intake faucets.
 *
 * A record is poured for the first time when each intake pours at least one value. Then it pours an updated record
 * each time one of intakes pours an update.
 *
 * The pouring of records completes once any of intakes completes its data pouring.
 *
 * @typeParam TIntakes - Type of intakes record.
 * @param intakes - Intakes record.
 *
 * @returns Faucet of records containing values poured by each intake under corresponding key.
 */
export function withAll<TIntakes extends WithAll.Intakes>(
  intakes: TIntakes,
): DataFaucet<WithAll.SeepType<TIntakes>> {
  type TSeep = WithAll.SeepType<TIntakes>;

  return async (sink, sinkSpply = new Supply()) => {
    const whenDone = sinkSpply.whenDone();
    let prevValues: Partial<TSeep> = {};
    let values: Partial<TSeep> | null = null;
    const keys = Reflect.ownKeys(intakes);

    let missing = keys.length;
    let ready: () => void = noop;
    let whenReady: Promise<void> | null = null;
    const pourAll = async (): Promise<void> => {
      if (!missing) {
        ready();
      } else {
        if (!whenReady) {
          whenReady = new Promise<void>(resolve => {
            ready = resolve;
          }).then(() => {
            ready = noop;
            whenReady = null;
          });
        }

        await whenReady;
      }

      // Prevent values from overriding while sinking them.
      let newValues: TSeep;

      if (values) {
        newValues = values as TSeep;
        prevValues = values;
        values = null;
      } else {
        newValues = prevValues as TSeep;
      }

      try {
        await sinkValue(newValues, sink, sinkSpply.derive());
      } finally {
        if (!values && prevValues === newValues) {
          // Values not altered while sinking.
          values = prevValues;
          prevValues = {};
        }
      }
    };

    keys.forEach(<TKey extends keyof TIntakes>(key: TKey) => {
      const intake = intakes[key] as IntakeFaucet<TSeep[TKey]> | undefined;

      if (!intake) {
        --missing;

        return;
      }

      let valueCount = 0;
      const sink: DataSink<TSeep[TKey]> = async (value, valueSupply): Promise<void> => {
        if (values) {
          values[key] = value;
        } else {
          // Values currently sinking. Clone previous ones.
          values = {
            ...prevValues,
            [key]: value,
          };
        }

        let firstValue = !valueCount++;

        valueSupply.needs(sinkSpply).whenOff(() => {
          if (!--valueCount) {
            firstValue = false;
            ++missing;
          }
        });

        if (firstValue) {
          --missing;
        }

        await pourAll();
      };

      intake(sink, sinkSpply).then(
        () => sinkSpply.done(),
        error => sinkSpply.fail(error),
      );
    });

    if (!missing) {
      // No intakes. Pour once then finish.
      await pourAll();
      sinkSpply.off();
    }

    return await whenDone;
  };
}

export namespace WithAll {
  /**
   * Intakes record for data faucet created by {@link withAll} function.
   *
   * Contains {@link IntakeFaucet intake data faucets} under arbitrary keys. The poured record would be combined of
   * data values under the same keys corresponding to each intake.
   */
  export type Intakes = {
    readonly [key in PropertyKey]: IntakeFaucet<unknown>;
  };

  /**
   * Type of record poured by data faucet created by {@link withAll} function.
   *
   * @typeParam TIntakes - Type of intakes record.
   */
  export type SeepType<TIntakes extends Intakes> = {
    [key in keyof TIntakes]: FaucetSeepType<TIntakes[key]>;
  };
}

import { noop } from '@proc7ts/primitives';
import { Supply } from '@proc7ts/supply';
import { DataFaucet, IntakeFaucet } from '../data-faucet.js';
import { DataSink } from '../data-sink.js';

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

  return async (sink, sinkSupply = new Supply()) => {
    const keys = Reflect.ownKeys(intakes);

    let totalIntakeCount = keys.length;
    let missingIntakeCount = totalIntakeCount;
    let intakesReady: () => void = noop;
    let whenIntakesReady: Promise<void> | null = null;

    const allValuesSupply = new Supply();
    let activeSinkCount = 0;
    let prevValues: Partial<TSeep> = {};
    let values: Partial<TSeep> | null = null; // null while sinking!

    const pourValues = async (): Promise<void> => {
      if (!missingIntakeCount) {
        intakesReady();
      } else {
        if (!whenIntakesReady) {
          whenIntakesReady = new Promise<void>(resolve => {
            intakesReady = resolve;
          }).then(() => {
            intakesReady = noop;
            whenIntakesReady = null;
          });
        }

        await whenIntakesReady;
      }

      // Prevent values from overriding while sinking them.
      let sankValues: TSeep;

      if (values) {
        sankValues = values as TSeep;
        prevValues = values;
        values = null;
      } else {
        sankValues = prevValues as TSeep;
      }

      ++activeSinkCount; // More than one sink may be active at a time.
      try {
        await sink(sankValues);
      } finally {
        if (!values && prevValues === sankValues) {
          // Values not altered while sinking.
          values = prevValues;
          prevValues = {};
        }
        if (!--activeSinkCount) {
          // Stop pouring when all sinks completed.
          allValuesSupply.done();
        }
      }
    };

    const intakeSinkSupply = new Supply(reason => {
      if (missingIntakeCount) {
        // Complete processing only if some intakes still missing.
        allValuesSupply.cutOff(reason);
      }
    })
      .needs(sinkSupply)
      .needs(allValuesSupply);

    keys.forEach(<TKey extends keyof TIntakes>(key: TKey) => {
      const intake = intakes[key] as IntakeFaucet<TSeep[TKey]> | undefined;

      if (!intake) {
        // Handle missing intake.
        --missingIntakeCount;
        --totalIntakeCount;

        return;
      }

      let prevIntakeValueSupply: Supply | null = null;

      const sinkIntake: DataSink<TSeep[TKey]> = async (value): Promise<void> => {
        if (values) {
          values[key] = value;
        } else {
          // Values currently sinking. Clone previous ones.
          values = {
            ...prevValues,
            [key]: value,
          };
        }

        if (prevIntakeValueSupply) {
          // Previous intake value is no longer in use.
          prevIntakeValueSupply.done();
        } else {
          // First value from this intake.
          --missingIntakeCount;
        }

        // While intake value is in use, its sink should not return, as this makes the value invalid.
        const intakeValueSupply = new Supply().needs(allValuesSupply).needs(intakeSinkSupply);

        prevIntakeValueSupply = intakeValueSupply;

        await pourValues();
        await intakeValueSupply.whenDone();
      };

      intake(sinkIntake, intakeSinkSupply).catch(error => allValuesSupply.fail(error));
    });

    if (!totalIntakeCount) {
      // No intakes. Pour once then finish.
      await pourValues();
      allValuesSupply.done();
    }

    return await allValuesSupply.whenDone();
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
    [key in keyof TIntakes]: DataFaucet.SeepType<TIntakes[key]>;
  };
}

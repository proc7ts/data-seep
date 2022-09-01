import { noop } from '@proc7ts/primitives';
import { Supply } from '@proc7ts/supply';
import { DataFaucet, FaucetSeepType, IntakeFaucet } from './data-faucet.js';
import { DataSink } from './data-sink.js';
import { sinkValue } from './sink-value.js';

export function withAll<TIntakes extends WithAll.Intakes>(
  intakes: TIntakes,
): DataFaucet<WithAll.SeepType<TIntakes>> {
  type TSeep = WithAll.SeepType<TIntakes>;

  return async (sink, supply = new Supply()) => {
    const whenDone = supply.whenDone();
    let prevValues: Partial<TSeep> = {};
    let values: Partial<TSeep> | null = null;
    const keys = Reflect.ownKeys(intakes);

    let missing = keys.length;
    let ready: () => void = noop;
    let whenReady: Promise<void> | null = null;
    const emit = async (): Promise<void> => {
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
        await sinkValue(newValues, sink, new Supply().needs(supply));
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

        valueSupply.needs(supply).whenOff(() => {
          if (!--valueCount) {
            firstValue = false;
            ++missing;
          }
        });

        if (firstValue) {
          --missing;
        }

        await emit();
      };

      intake(sink, supply).then(
        () => supply.done(),
        error => supply.fail(error),
      );
    });

    if (!missing) {
      // No inputs. Emit once then finish.
      await emit();
      supply.off();
    }

    return await whenDone;
  };
}

export namespace WithAll {
  export type Intakes = {
    readonly [key in PropertyKey]: IntakeFaucet<unknown>;
  };

  export type SeepType<TIntakes extends Intakes> = {
    [key in keyof TIntakes]: FaucetSeepType<TIntakes[key]>;
  };
}

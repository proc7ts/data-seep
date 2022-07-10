import { noop } from '@proc7ts/primitives';
import { Supply } from '@proc7ts/supply';
import { DataFaucet, FaucetValueType, InputFaucet } from './data-faucet.js';
import { DataSink } from './data-sink.js';
import { sinkValue } from './sink-value.js';

export function withAll<TInputMap extends WithAll.InputMap>(
    inputs: TInputMap,
): DataFaucet<WithAll.ResultType<TInputMap>> {

  type TResult = WithAll.ResultType<TInputMap>;

  return async (sink, supply = new Supply()) => {

    const whenDone = supply.whenDone();
    let prevValues: Partial<TResult> = {};
    let values: Partial<TResult> | null = null;
    const keys = Reflect.ownKeys(inputs);

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

      // Prevent values from overriding while sinking them
      let newValues: TResult;

      if (values) {
        newValues = values as TResult;
        prevValues = values;
        values = null;
      } else {
        newValues = prevValues as TResult;
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

    keys.forEach(<TKey extends keyof TInputMap>(key: TKey) => {

      const input = inputs[key] as InputFaucet<TResult[TKey]> | undefined;

      if (!input) {
        --missing;

        return;
      }

      let valueCount = 0;
      const sink: DataSink<TResult[TKey]> = async (value, valueSupply): Promise<void> => {
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

      input(sink, supply).then(() => supply.done(), error => supply.fail(error));
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

  export type InputMap = {
    readonly [key in PropertyKey]: InputFaucet<unknown>;
  };

  export type ResultType<TInputMap extends InputMap> = {
    [key in keyof TInputMap]: FaucetValueType<TInputMap[key]>;
  };

}

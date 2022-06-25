import { noop } from '@proc7ts/primitives';
import { Supply } from '@proc7ts/supply';
import { DataSink } from './data-sink.js';
import { sinkValue } from './sink-value.js';

export async function withAll<TSourceMap extends WithAll.SourceMap>(
    sources: TSourceMap,
    sink: DataSink<WithAll.ResultType<TSourceMap>>,
): Promise<void> {

  type TResult = WithAll.ResultType<TSourceMap>;

  const supply = new Supply();
  const whenDone = supply.whenDone();
  let prevValues: Partial<TResult> = {};
  let values: Partial<TResult> | null = null;
  const keys = Reflect.ownKeys(sources);

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

  keys.forEach(<TKey extends keyof TSourceMap>(key: TKey) => {

    const source = sources[key] as WithAll.Source<TResult[TKey]> | undefined;

    if (!source) {
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

    source(sink, supply).then(() => supply.off(), error => supply.off(error));
  });

  if (!missing) {
    // No sources. Emit once then finish.
    await emit();
    supply.off();
  }

  return await whenDone;
}

export namespace WithAll {

  export type SourceMap = {
    readonly [key in PropertyKey]: Source;
  };

  export type Source<out T = unknown> = (this: void, sink: DataSink<T>, supply: Supply) => Promise<void>;

  export type SourceValueType<TSource extends Source> = TSource extends Source<infer T> ? T : never;

  export type ResultType<TSourceMap extends SourceMap> = {
    [key in keyof TSourceMap]: SourceValueType<TSourceMap[key]>;
  };

}

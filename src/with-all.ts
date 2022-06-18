import { PromiseResolver } from '@proc7ts/async';
import { noop } from '@proc7ts/primitives';
import { Supply } from '@proc7ts/supply';
import { DataSink } from './data-sink.js';
import { sinkValue } from './sink-value.js';

export async function withAll<TResult extends WithAll.Result>(
    sources: WithAll.Sources<TResult>,
    sink: DataSink<TResult>,
): Promise<void> {

  const supply = new Supply();
  const whenDone = supply.whenDone();
  const deps = new WithAll$DepsResolver<TResult>(supply);
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

  keys.forEach(<TKey extends keyof TResult>(key: TKey) => {

    const source = sources[key] as ((
        this: void,
        sink: DataSink<TResult[TKey]>,
        deps: WithAll.Deps<TResult>,
    ) => Promise<void>) | undefined;

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

      deps.set(key, value, valueSupply);

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

    source(sink, deps.deps).then(() => supply.off(), error => supply.off(error));
  });

  if (!missing) {
    // No sources. Emit once then finish.
    await emit();
    supply.off();
  }

  return await whenDone;
}

export namespace WithAll {

  export type Result = {
    [key in PropertyKey]: unknown;
  };

  export interface Deps<TResult extends Result> {
    readonly supply: Supply;

    get<TKey extends keyof TResult>(key: TKey): Promise<TResult[TKey]>;
  }

  export type Sources<TResult extends Result> = {
    readonly [key in keyof TResult]: (
        this: void,
        sink: DataSink<TResult[key]>,
        deps: Deps<TResult>,
    ) => Promise<void>;
  };

}

class WithAll$DepsResolver<TResult extends WithAll.Result> {

  readonly #resolvers = new Map<PropertyKey, unknown>();
  readonly deps: WithAll$Deps<TResult>;

  constructor(supply: Supply) {
    this.deps = new WithAll$Deps(this, supply);
  }

  get<TKey extends keyof TResult>(key: TKey): Promise<TResult[TKey]> {

    let resolver = this.#resolvers.get(key) as PromiseResolver<TResult[TKey]> | undefined;

    if (!resolver) {
      resolver = new PromiseResolver();
      this.#resolvers.set(key, resolver);
    }

    return resolver.whenDone();
  }

  set<TKey extends keyof TResult>(key: TKey, value: TResult[TKey], supply: Supply): void {

    const resolver = this.#resolvers.get(key) as PromiseResolver<TResult[TKey]> | undefined;

    if (resolver) {
      resolver.resolve(value);
    }

    const newResolver = new PromiseResolver<TResult[TKey]>();

    supply.whenOff(({ error = new ReferenceError(`Dependency ${String(key)} is no longer available`) }) => {
      newResolver.reject(error);
    });
    newResolver.resolve(value);

    this.#resolvers.set(key, newResolver);
  }

}

class WithAll$Deps<TResult extends WithAll.Result> implements WithAll.Deps<TResult> {

  readonly #resolver: WithAll$DepsResolver<TResult>;
  readonly #supply: Supply;

  constructor(resolver: WithAll$DepsResolver<TResult>, supply: Supply) {
    this.#resolver = resolver;
    this.#supply = supply;
  }

  get supply(): Supply {
    return this.#supply;
  }

  get<TKey extends keyof TResult>(key: TKey): Promise<TResult[TKey]> {
    return this.#resolver.get(key);
  }

}

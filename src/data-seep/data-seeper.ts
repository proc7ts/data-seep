import { Supply } from '@proc7ts/supply';
import { DataFaucet, FaucetKind } from '../data-faucet.js';
import { DataSink } from '../data-sink.js';
import { sinkValue } from '../sink-value.js';
import { DataIntake, DataSeep } from './data-seep.js';
import { DataSinkError } from './data-sink.error.js';
import { DefaultDataSeep } from './default-data-seep.js';

export class DataSeeper<TSeep extends DataSeep = DataSeep> {

  readonly #seepFactory: DataSeep.Factory<TSeep>;
  readonly #intakes = new Map<FaucetKind<unknown, unknown[]>, DataIntake<unknown, unknown[], TSeep>>();

  constructor(
      ...init: DataSeep extends DataSeep
      ? [seepFactory?: DataSeep.Factory<TSeep>]
      : [seepFactory: DataSeep.Factory<TSeep>]
  );

  constructor(seepFactory: DataSeep.Factory<TSeep> = DataSeep$createDefault) {
    this.#seepFactory = seepFactory;
  }

  assert<T, TOptions extends unknown[]>(
      kind: FaucetKind<T, TOptions>,
      intake: DataIntake<T, TOptions, TSeep>,
  ): this {
    this.#intakes.set(kind as FaucetKind<unknown, unknown[]>, intake as DataIntake<unknown, unknown[], TSeep>);

    return this;
  }

  async with(sink: DataSink<TSeep>, supply: Supply = new Supply()): Promise<void> {

    const seep = this.#seepFactory(new DataSeep$Seeper(this.#intakes, supply));

    await seep(sink, supply);
  }

}

class DataSeep$Seeper<TSeep extends DataSeep> implements DataSeep.Seeper<TSeep> {

  readonly #intakes = new Map<FaucetKind<unknown, unknown[]>, DataIntake<unknown, unknown[], TSeep>>();
  readonly #supply: Supply;
  readonly #faucets = new Map<FaucetKind<unknown, unknown[]>, DataFaucet<unknown>>();

  constructor(
      intakes: Map<FaucetKind<unknown, unknown[]>, DataIntake<unknown, unknown[], TSeep>>,
      supply: Supply,
  ) {
    this.#intakes = intakes;
    this.#supply = supply;
  }

  get supply(): Supply {
    return this.#supply;
  }

  faucetFor<T, TOptions extends []>(
      kind: FaucetKind<T, TOptions>,
      seep: TSeep,
  ): DataFaucet<T> {
    let faucet = this.#faucets.get(kind as FaucetKind<unknown, unknown[]>) as DataFaucet<T> | undefined;

    if (!faucet) {

      const intake = this.#intakes.get(kind as FaucetKind<unknown, unknown[]>) as DataIntake<T, TOptions, TSeep>;

      if (intake) {

        const intakeFaucet = intake(kind, seep);

        faucet = async (sink, supply = new Supply()) => {
          await intakeFaucet(sink, supply.needs(this.#supply));
        };
      } else {
        faucet = () => Promise.reject(new DataSinkError(
            undefined,
            {
              faucetKind: kind as FaucetKind<unknown, unknown[]>,
            },
        ));
      }
    }

    return faucet;
  }

}

function DataSeep$createDefault<TSeep extends DataSeep>(
    seeper: DataSeep.Seeper,
): DataFaucet<TSeep> {
  return async (sink, supply) => await sinkValue(
      new DefaultDataSeep(seeper) as DataSeep as TSeep,
      sink,
      supply,
  );
}

import { Supply } from '@proc7ts/supply';
import { DataFaucet, FaucetKind } from '../data-faucet.js';
import { DataSink } from '../data-sink.js';
import { sinkValue } from '../sink-value.js';
import { DataFlux } from './data-flux.js';
import { DataSeep } from './data-seep.js';
import { DataSinkError } from './data-sink.error.js';
import { DefaultDataFlux } from './default-data-flux.js';

export class DataAssertions<TFlux extends DataFlux = DataFlux> {

  readonly #fluxFactory: DataFlux.Factory<TFlux>;
  readonly #seeps = new Map<FaucetKind<unknown, unknown[]>, DataSeep<unknown, unknown[], TFlux>>();

  constructor(
      ...init: DataFlux extends DataFlux
          ? [fluxFactory?: DataFlux.Factory<TFlux>]
          : [fluxFactory: DataFlux.Factory<TFlux>]
  );

  constructor(fluxFactory: DataFlux.Factory<TFlux> = DataFlux$createDefault) {
    this.#fluxFactory = fluxFactory;
  }

  assert<T, TOptions extends unknown[]>(
      kind: FaucetKind<T, TOptions>,
      seep: DataSeep<T, TOptions, TFlux>,
  ): this {
    this.#seeps.set(kind as FaucetKind<unknown, unknown[]>, seep as DataSeep<unknown, unknown[], TFlux>);

    return this;
  }

  async with(sink: DataSink<TFlux>, supply: Supply = new Supply()): Promise<void> {

    const flux = this.#fluxFactory(new DataFlux$Source(this.#seeps, supply));

    await flux(sink, supply);
  }

}

class DataFlux$Source<TFlux extends DataFlux> implements DataFlux.Source<TFlux> {

  readonly #seeps = new Map<FaucetKind<unknown, unknown[]>, DataSeep<unknown, unknown[], TFlux>>();
  readonly #supply: Supply;
  readonly #faucets = new Map<FaucetKind<unknown, unknown[]>, DataFaucet<unknown>>();

  constructor(
      seeps: Map<FaucetKind<unknown, unknown[]>, DataSeep<unknown, unknown[], TFlux>>,
      supply: Supply,
  ) {
    this.#seeps = seeps;
    this.#supply = supply;
  }

  get supply(): Supply {
    return this.#supply;
  }

  faucetFor<T, TOptions extends []>(kind: FaucetKind<T, TOptions>, flux: TFlux): DataFaucet<T> {

    let faucet = this.#faucets.get(kind as FaucetKind<unknown, unknown[]>) as DataFaucet<T> | undefined;

    if (!faucet) {

      const seep = this.#seeps.get(kind as FaucetKind<unknown, unknown[]>) as DataSeep<T, TOptions, TFlux>;

      if (seep) {

        const seepFaucet = seep(kind, flux);

        faucet = async (sink, supply = new Supply()) => {
          await seepFaucet(sink, supply.needs(this.#supply));
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

function DataFlux$createDefault<TFlux extends DataFlux>(
    source: DataFlux.Source,
): DataFaucet<TFlux> {
  return async (sink, supply) => await sinkValue(
      new DefaultDataFlux(source) as DataFlux as TFlux,
      sink,
      supply,
  );
}

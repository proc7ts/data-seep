import { DataFaucet } from './data-faucet.js';

/**
 * Data infusion is a factory function that creates a {@link DataFaucet data faucet}.
 *
 * It may also accept infusion options used to create faucet.
 *
 * Infusion instances may be used to identify data flows contained within {@link DataMix data mix}.
 *
 * Data infusion function names supposed have a `with` prefix. E.g. {@link withValue}, or {@link withAll}.
 *
 * @typeParam T - Infused data type. I.e. the type of data poured by created faucet.
 * @typeParam TOptions - Tuple type representing infusion options.
 * @param options - Infusion options.
 *
 * @returns Created data faucet.
 */
export type DataInfusion<out T, in TOptions extends unknown[]> = (
  ...options: TOptions
) => DataFaucet<T>;

/**
 * Type of data pured by faucets created by infusions of the given type.
 *
 * @typeParam TInfusion - Data infusion type.
 */
export type InfusionSeepType<TInfusion extends DataInfusion<unknown, any[]>> = TInfusion extends (
  ...options: any[]
) => DataFaucet<infer T>
  ? T
  : never;

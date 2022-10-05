import { DataFaucet, IntakeFaucet } from './data-faucet.js';

/**
 * Data seep is a function that constructs data faucet that pours data converted from `input` faucet.
 *
 * @typeParam TIn - Input data type.
 * @typeParam TOut - Output (converted) data type.
 */
export type DataSeep<in TIn, out TOut = TIn> = (
  this: void,
  input: IntakeFaucet<TIn>,
) => DataFaucet<TOut>;

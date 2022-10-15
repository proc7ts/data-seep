import { DataSeep } from '../data-seep.js';

export function seep<TIn, TOut>(seep: DataSeep<TIn, TOut>): DataSeep<TIn, TOut>;
export function seep<TIn, T1, TOut>(
  seep1: DataSeep<TIn, T1>,
  seep2: DataSeep<T1, TOut>,
): DataSeep<TIn, TOut>;
export function seep<TIn, T1, T2, TOut>(
  seep1: DataSeep<TIn, T1>,
  seep2: DataSeep<T1, T2>,
  seep3: DataSeep<T2, TOut>,
): DataSeep<TIn, TOut>;
export function seep<TIn, T1, T2, T3, TOut>(
  seep1: DataSeep<TIn, T1>,
  seep2: DataSeep<T1, T2>,
  seep3: DataSeep<T2, T3>,
  seep4: DataSeep<T3, TOut>,
): DataSeep<TIn, TOut>;
export function seep<TIn, T1, T2, T3, T4, TOut>(
  seep1: DataSeep<TIn, T1>,
  seep2: DataSeep<T1, T2>,
  seep3: DataSeep<T2, T3>,
  seep4: DataSeep<T3, T4>,
  seep5: DataSeep<T4, TOut>,
): DataSeep<TIn, TOut>;
export function seep<TIn, T1, T2, T3, T4, T5, TOut>(
  seep1: DataSeep<TIn, T1>,
  seep2: DataSeep<T1, T2>,
  seep3: DataSeep<T2, T3>,
  seep4: DataSeep<T3, T4>,
  seep5: DataSeep<T4, T5>,
  seep6: DataSeep<T5, TOut>,
): DataSeep<TIn, TOut>;
export function seep<TIn, T1, T2, T3, T4, T5, T6, TOut>(
  seep1: DataSeep<TIn, T1>,
  seep2: DataSeep<T1, T2>,
  seep3: DataSeep<T2, T3>,
  seep4: DataSeep<T3, T4>,
  seep5: DataSeep<T4, T5>,
  seep6: DataSeep<T5, T6>,
  seep7: DataSeep<T6, TOut>,
): DataSeep<TIn, TOut>;

export function seep(...seeps: DataSeep<unknown>[]): DataSeep<unknown> {
  return seeps.reduce((prev, seep) => faucet => seep(prev(faucet)));
}

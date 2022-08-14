import { withValue } from '../with-value.js';
import { DataSeep } from './data-seep.js';

export function seepValue<T, TOptions extends unknown[]>(value: T): DataSeep<T, TOptions> {

  const faucet = withValue(value);

  return () => faucet;
}

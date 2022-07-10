import { withValue } from '../with-value.js';
import { DataIntake } from './data-seep.js';

export function seepValue<T, TOptions extends unknown[]>(value: T): DataIntake<T, TOptions> {

  const faucet = withValue(value);

  return () => faucet;
}

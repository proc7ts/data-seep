import { DataIntake } from './data-seep.js';

export function seep<T, TOptions extends unknown[]>(...options: TOptions): DataIntake<T, TOptions> {
  return kind => kind(...options);
}

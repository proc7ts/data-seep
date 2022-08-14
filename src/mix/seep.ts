import { DataSeep } from './data-seep.js';

export function seep<T, TOptions extends unknown[]>(...options: TOptions): DataSeep<T, TOptions> {
  return infusion => infusion(...options);
}

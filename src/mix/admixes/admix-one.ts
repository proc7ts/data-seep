import { SupplyOut } from '@proc7ts/supply';
import { DataFaucet } from '../../data-faucet.js';
import { DataSink } from '../../data-sink.js';
import { DataAdmix } from '../data-admix.js';
import { DataMix } from '../data-mix.js';
import { ArrayAdmix } from './array-admix.impl.js';

/**
 * Creates admix of {@link admixArray array} element infusion.
 *
 * Infused arrays concatenated, so multiple such admixes may be added to the mix.
 *
 * @typeParam T - Infused array element type.
 * @typeParam TOptions - Tuple type representing infusion options.
 * @param admix - Admix of array to infuse.
 *
 * @returns Single-element array admix.
 */
export function admixOne<T, TOptions extends unknown[], TMix extends DataMix = DataMix>(
  admix: DataAdmix<T, [], TMix>,
): DataAdmix<T[], TOptions, TMix> {
  const { supply } = admix;

  return new ArrayAdmix({
    supply,
    blend(context) {
      const { supply } = context.mixer.add(withOne, admix);

      return {
        supply,
        pour(mix) {
          const oneFaucet = mix.pour(withOne);

          return async (sink: DataSink<T[]>, sinkSupply: SupplyOut) => {
            await oneFaucet(async (one: T) => {
              await sink([one]);
            }, sinkSupply);
          };
        },
      };

      function withOne(): DataFaucet<T> {
        throw new TypeError(`Can not infuse array element ${context.infuse.name}`);
      }
    },
  });
}

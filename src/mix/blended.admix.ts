import { Supply } from '@proc7ts/supply';
import { DataAdmix } from './data-admix.js';
import { DataMix } from './data-mix.js';
import { DataMixer } from './data-mixer.js';
import { SingleAdmix$Blend } from './impl/single-admix.blend.js';
import { SingleAdmix } from './single.admix.js';

/**
 * Blended data admixture (ingredient) of {@link DataMix data mix}.
 *
 * This implemetation is able to infuse data combined from multiple admixes.
 *
 * @typeParam T - Infused data type.
 * @typeParam TOptions - Tuple type representing infusion options.
 * @typeParam TMix - Type of resulting data mix.
 */
export interface BlendedAdmix<
  out T,
  in out TOptions extends unknown[] = [],
  in out TMix extends DataMix = DataMix,
> {
  /**
   * Optional admix supply.
   *
   * Once cut off, the admix will be removed from the mix and thus won't pour any data.
   *
   * This supply will be returrned from {@link DataMixer#add} method. New one will be created otherwise.
   */
  readonly supply?: Supply | undefined;

  /**
   * Creates new data blend.
   *
   * This method called once this admix {@link DataMixer#add added} to the mix.
   *
   * A {@link replace} method is called instead if defined and admix for the same infusion already added to the mix.
   *
   * @param context - Context of admix addition.
   *
   * @returns Data blend used to pour infused data.
   */
  blend(context: DataAdmix.AdditionContext<T, TOptions, TMix>): DataAdmix.Blend<T, TOptions, TMix>;

  /**
   * Replaces existing admix fior the same infusion.
   *
   * @param context - Context of admix replacement.
   *
   * @returns Data blend used to pour infused data from now on.
   */
  replace?(
    context: DataAdmix.ReplacementContext<T, TOptions, TMix>,
  ): DataAdmix.Blend<T, TOptions, TMix>;
}

/**
 * Converts arbitrary data admix to blended one.
 *
 * @param admix - Original data admix.
 *
 * @returns Either original `admix` if it is blended already, or new blended admix converted from original one.
 */
export function BlendedAdmix<T, TOptions extends unknown[], TMix extends DataMix = DataMix>(
  admix: DataAdmix<T, TOptions, TMix>,
): BlendedAdmix<T, TOptions, TMix> {
  return admix.blend ? admix : new BlendedAdmix$BySingle(admix);
}

class BlendedAdmix$BySingle<T, TOptions extends unknown[], TMix extends DataMix>
  implements BlendedAdmix<T, TOptions, TMix> {

  readonly #admix: SingleAdmix<T, TOptions, TMix>;

  constructor(admix: SingleAdmix<T, TOptions, TMix>) {
    this.#admix = admix;
  }

  get supply(): Supply | undefined {
    return this.#admix.supply;
  }

  blend(context: DataAdmix.AdditionContext<T, TOptions, TMix>): DataAdmix.Blend<T, TOptions, TMix> {
    return new SingleAdmix$Blend(context.infuse, this.#admix, new Supply());
  }

}

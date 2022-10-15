import { Supply } from '@proc7ts/supply';
import { IntakeFaucet } from '../data-faucet.js';
import { DataInfusion } from '../data-infusion.js';
import { BlendedAdmix } from './blended.admix.js';
import { DataMix } from './data-mix.js';
import { DataMixer } from './data-mixer.js';
import { SingleAdmix } from './single.admix.js';

/**
 * Data admixture (ingredient) of {@link DataMix data mix}.
 *
 * When {@link DataMixer#add added} to data mixture, the resulting data mix provides access to the data poured by
 * corresponding data infusion.
 *
 * Names of functions creating data admixes supposed to have an `admix` prefix. E.g. {@link admixWith}
 * or {@link admixValue},
 *
 * Admixture can be either {@link SingleAdmix single}, or {@link BlendedAdmix blended}.
 *
 * @typeParam T - Infused data type.
 * @typeParam TOptions - Tuple type representing infusion options.
 * @typeParam TMix - Type of resulting data mix.
 */
export type DataAdmix<T, TOptions extends unknown[] = [], TMix extends DataMix = DataMix> =
  | SingleAdmix<T, TOptions, TMix>
  | BlendedAdmix<T, TOptions, TMix>;

export namespace DataAdmix {
  /**
   * Admix handle created when admix {@link DataMixer#add added} to mix.
   */
  export interface Handle {
    /**
     * Admix supply.
     *
     * Once cut off, the `admix` will be removed from the mix and thus won't pour any data.
     */
    readonly supply: Supply;

    /**
     * Awaits for admix to actually added to the mix and sank by consumers.
     *
     * @returns Promise resolved when admix sank by its consumers.
     */
    whenSank(this: void): Promise<void>;
  }

  /**
   * An update to admix.
   *
   * Either {@link Added added}, or {@link Removed} admix info.
   *
   * @typeParam T - Type of data infused by admix.
   * @typeParam TOptions - Tuple type representing infusion options.
   */
  export type Update<T, TOptions extends unknown[]> = Added<T, TOptions> | Removed<T, TOptions>;

  /**
   * Information about admix {@link DataMixer#add added} to the mix.
   *
   * @typeParam T - Type of data infused by added admix.
   * @typeParam TOptions - Tuple type representing infusion options.
   */
  export interface Added<out T, in TOptions extends unknown[]> {
    /**
     * The infusion of the data poured by added admix.
     */
    readonly infuse: DataInfusion<T, TOptions>;

    /**
     * Admix supply.
     *
     * Once cut off, the admix will be removed from the mix and thus won't pour any data.
     */
    readonly supply: Supply;

    /**
     * Faucet that pours the data infused by admix.
     */
    readonly faucet: IntakeFaucet<T>;
  }

  /**
   * Information about admix removed from the mix.
   *
   * @typeParam T - Type of data infused by added admix.
   * @typeParam TOptions - Tuple type representing infusion options.
   */
  export interface Removed<out T, in TOptions extends unknown[]> {
    /**
     * The infusion of the data poured by removed admix.
     */
    readonly infuse: DataInfusion<T, TOptions>;

    /**
     * Cut off  admix supply.
     */
    readonly supply: Supply;

    readonly faucet?: undefined;
  }

  /**
   * Context of data pouring by admix.
   *
   * Passed to admix in order to {@link SingleAdmix#pour pour} infused data.
   *
   * @typeParam T - Type of data infused by admix.
   * @typeParam TOptions - Tuple type representing infusion options.
   * @typeParam TMix - Type of resulting data mix.
   */
  export interface PouringContext<out T, in TOptions extends unknown[], out TMix extends DataMix> {
    /**
     * The infusion of data to pour by admix.
     */
    readonly infuse: DataInfusion<T, TOptions>;

    /**
     * Target data mix.
     */
    readonly mix: TMix;

    /**
     * Admix supply.
     *
     * The one provided {@link SingleAdmix#supply explicitly}, or the one created automatically otherwise.
     */
    readonly supply: Supply;
  }

  /**
   * Data admix addition request.
   *
   * Passed by {@link DataMixer#add} method to admix in order to {@link BlendedAdmix#blend create} new data blend.
   *
   * @typeParam T - Type of data infused by admix.
   * @typeParam TOptions - Tuple type representing infusion options.
   * @typeParam TMix - Type of resulting data mix.
   */
  export interface AdditionRequest<
    out T,
    in TOptions extends unknown[],
    in out TMix extends DataMix,
  > {
    /**
     * The infusion of data to pour by admix.
     */
    readonly infuse: DataInfusion<T, TOptions>;

    /**
     * Data mixer the admix is added by.
     */
    readonly mixer: DataMixer<TMix>;

    /**
     * Admix supply.
     *
     * The one provided {@link BlendedAdmix#supply explicitly}, or the one created automatically otherwise.
     */
    readonly supply: Supply;
  }

  /**
   * Data admix extension request.
   *
   * Passed by {@link DataAdmix#add} method to existing admix data blend in order to {@link Blend#extend extend} it.
   *
   * @typeParam T - Type of data infused by admix.
   * @typeParam TOptions - Tuple type representing infusion options.
   * @typeParam TMix - Type of resulting data mix.
   */
  export interface ExtensionRequest<
    out T,
    in out TOptions extends unknown[],
    in out TMix extends DataMix,
  > extends AdditionRequest<T, TOptions, TMix> {
    /**
     * Added admix.
     */
    readonly added: DataAdmix<T, TOptions, TMix>;
  }

  /**
   * Data admix replacement request.
   *
   * Passed by {@link DataMixer#add} method to admix in order to {@link BlendedAdmix#replace replace} existing admix.
   *
   * @typeParam T - Type of data infused by admix.
   * @typeParam TOptions - Tuple type representing infusion options.
   * @typeParam TMix - Type of resulting data mix.
   */
  export interface ReplacementRequest<
    out T,
    in out TOptions extends unknown[],
    in out TMix extends DataMix = DataMix,
  > extends AdditionRequest<T, TOptions, TMix> {
    /**
     * Replaced admix data info.
     */
    readonly replaced: {
      /**
       * Replaced data admix.
       */
      readonly admix: DataAdmix<T, TOptions, TMix>;

      /**
       * Replaced data blend.
       *
       * Note that the one always exists. For {@link SingleAdmix} the one created automatically.
       */
      readonly blend: Blend<T, TOptions, TMix>;

      /**
       * Replaced admix supply.
       */
      readonly supply: Supply;
    };
  }

  /**
   * Admix data blend.
   *
   * Created by {@link BlendedAdmix} and used to pour infused data.
   *
   * @typeParam T - Infused data type.
   * @typeParam TOptions - Tuple type representing infusion options.
   * @typeParam TMix - Type of resulting data mix.
   */
  export interface Blend<
    out T,
    in out TOptions extends unknown[],
    in out TMix extends DataMix = DataMix,
  > {
    /**
     * Infusion supply.
     *
     * Once cut off, all admixes for the infusion will be removed from the mix.
     */
    readonly supply: Supply;

    /**
     * Pours data infused to the given data `mix`.
     *
     * @param mix - Target data mix.
     *
     * @returns Infused data faucet.
     */
    pour(mix: TMix): IntakeFaucet<T>;

    /**
     * When defined, this method called when another admix added after this blend created.
     *
     * This method is not called when the added blended admix has a {@link BlendedAdmix#replace replace} method, which
     * is called instead.
     *
     * @param request - Admix extension request.
     *
     * @returns Data blend used to pour infused data from now on.
     */
    extend?(request: ExtensionRequest<T, TOptions, TMix>): Blend<T, TOptions, TMix>;
  }
}

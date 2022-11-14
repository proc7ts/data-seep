import { DataFaucet } from './data-faucet.js';
import { DataSeep } from './data-seep.js';
import { DataAdmix } from './mix/data-admix.js';
import { DataMix } from './mix/data-mix.js';
import { DataMixer } from './mix/data-mixer.js';
import { mapSeep } from './seeps/map.seep.js';

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
export interface DataInfusion<out T, in TOptions extends unknown[]> {
  /**
   * Customizer of custom data infusion.
   *
   * This method is called once per {@link DataMixer data mixer}.
   *
   * @typeParam TMix - Type of data mix the data infused into.
   * @param mixer - Data mixer the data infused into.
   *
   * @returns Custom data infuser.
   */
  DataInfusion$into?<TMix extends DataMix>(
    mixer: DataMixer<TMix>,
  ): DataInfusion.Infuser<T, TOptions, TMix>;

  (this: void, ...options: TOptions): DataFaucet<T>;
}

/**
 * Creates custom data infusion.
 *
 * Created infusion infuses data with faucet created by the given infusion function. It is a different instance,
 * however.
 *
 * @param infuse - Data infusion to customize.
 * @param init - Initialization options.
 *
 * @returns Custom data infusion.
 */
export function DataInfusion<T, TOptions extends unknown[] = []>(
  infuse: DataInfusion<T, TOptions>,
  init?: DataInfusion.Init<T, TOptions>,
): DataInfusion<T, TOptions>;

export function DataInfusion<T, TOptions extends unknown[] = []>(
  infuse: DataInfusion<T, TOptions>,
  { name = infuse.name, into }: DataInfusion.Init<T, TOptions> = {},
): DataInfusion<T, TOptions> {
  const { [name]: infusion } = {
    [name](this: void, ...options: TOptions) {
      return infuse(...options);
    },
  } as { [key: typeof name]: DataInfusion<T, TOptions> };

  if (into) {
    infusion.DataInfusion$into = function <TMix extends DataMix>(
      this: DataInfusion<T, TOptions>,
      mixer: DataMixer<TMix>,
    ) {
      const infuserInit: DataInfusion.InfuserInit<T, TOptions, TMix> = into.call<
        DataInfusion<T, TOptions>,
        [DataMixer<TMix>],
        DataInfusion.InfuserInit<T, TOptions, TMix>
      >(this, mixer);

      if (!infuserInit.seep) {
        return infuserInit;
      }

      return {
        ...infuserInit,
        watch<TUpdate extends DataAdmix.Update<T, TOptions>>(
          mix: TMix,
        ): DataSeep<TUpdate, DataAdmix.Update<T, TOptions>> {
          const updateSeep = infuserInit.watch?.<TUpdate>(mix);
          const dataSeep: DataSeep<T> = infuserInit.seep!(mix);
          const updateDataSeep = mapSeep(
            (update: DataAdmix.Update<T, TOptions>): DataAdmix.Update<T, TOptions> => {
              if (!update.faucet) {
                return update;
              }

              return {
                ...update,
                faucet: dataSeep(update.faucet),
              };
            },
          );

          if (updateSeep) {
            return faucet => updateDataSeep(updateSeep(faucet));
          }

          return updateDataSeep;
        },
      };
    };
  } else {
    infusion.DataInfusion$into = infuse.DataInfusion$into;
  }

  return infusion;
}

export namespace DataInfusion {
  /**
   * Data infusion initialization options.
   *
   * Used to {@link DataInfusion:function create} custom data infusion.
   *
   * @typeParam T - Infused data type. I.e. the type of data poured by created faucet.
   * @typeParam TOptions - Tuple type representing infusion options.
   */
  export interface Init<out T, in TOptions extends unknown[]> {
    /**
     * Function name of custom data infusion.
     *
     * @defaultValue Original infusion function name.
     */
    readonly name?: string | undefined;

    /**
     * Data infusion {@link DataInfusion#DataInfusion$into customizer}.
     *
     * @typeParam TMix - Type of data mix the data infused into.
     * @param this - Always refers to infusion itself.
     * @param mixer - Data mixer the data infused into.
     *
     * @returns Initializer of custom data infuser.
     */
    into?<TMix extends DataMix>(
      this: DataInfusion<T, TOptions>,
      mixer: DataMixer<TMix>,
    ): DataInfusion.InfuserInit<T, TOptions, TMix>;
  }

  /**
   * Initializer of {@link Infuser custom data infuser}.
   *
   * @typeParam T - Infused data type. I.e. the type of data poured by created faucet.
   * @typeParam TOptions - Tuple type representing infusion options.
   * @typeParam TMix - Type of data mix the data infused into.
   */
  export interface InfuserInit<
    out T,
    in TOptions extends unknown[],
    in out TMix extends DataMix = DataMix,
  > extends Infuser<T, TOptions, TMix> {
    /**
     * Creates infused data seep.
     *
     * This is a convenience option that produces an additional data seep of {@link Infuser#watch admix updates}.
     *
     * @param mix - Source data mix.
     *
     * @returns Infused data seep.
     */
    seep?<TData extends T>(mix: TMix): DataSeep<TData, T>;
  }

  /**
   * Type of data poured by faucets created by infusions of the given type.
   *
   * @typeParam TInfusion - Data infusion type.
   */
  export type SeepType<TInfusion extends DataInfusion<unknown, any[]>> = TInfusion extends (
    ...options: any[]
  ) => DataFaucet<infer T>
    ? T
    : never;

  /**
   * Data infuser customizing the process of data infusion.
   *
   * @typeParam T - Infused data type. I.e. the type of data poured by created faucet.
   * @typeParam TOptions - Tuple type representing infusion options.
   * @typeParam TMix - Type of data mix the data infused into.
   */
  export interface Infuser<
    out T,
    in TOptions extends unknown[],
    in out TMix extends DataMix = DataMix,
  > {
    /**
     * Creates data seep of admix updates.
     *
     * This method is called whenever admix updates {@link DataMix#watch watched}. The faucet returned by created seep
     * returned to user instead of original one.
     *
     * @param mix - Source data mix.
     *
     * @returns Admix updates seep.
     */
    watch?<TUpdate extends DataAdmix.Update<T, TOptions>>(
      mix: TMix,
    ): DataSeep<TUpdate, DataAdmix.Update<T, TOptions>>;
  }
}

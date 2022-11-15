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
   * Customizes data infusion.
   *
   * This method is called once per {@link DataMixer data mixer}.
   *
   * @typeParam TMix - Type of data mix the data infused into.
   * @param mixer - Data mixer the data infused into.
   * @param infuse - Customized infusion.
   *
   * @returns Custom data infuser.
   */
  DataInfusion$into?<TMix extends DataMix>(
    this: void,
    mixer: DataMixer<TMix>,
    infuse: DataInfusion<T, TOptions>,
  ): DataInfusion.Infuser<T, TOptions, TMix>;

  (this: void, ...options: TOptions): DataFaucet<T>;
}

/**
 * Creates custom data infusion.
 *
 * Infuses data with faucet created by the given infusion function.
 *
 * @param infuse - Data infusion to customize.
 * @param init - Data infusion initializer.
 *
 * @returns New custom data infusion instance.
 */
export function DataInfusion<T, TOptions extends unknown[] = []>(
  infuse: DataInfusion<T, TOptions>,
  init: DataInfusion.Init<T, TOptions> = {},
): DataInfusion<T, TOptions> {
  let customInit: DataInfusion.CustomInit<T, TOptions>;

  if (DataInfusion$isSeepInit(init)) {
    customInit = {
      ...init,
      into: () => ({
        seep: () => init.seep,
      }),
    };
  } else {
    customInit = init;
  }

  const { DataInfusion$into: prevInto } = infuse;
  const { name = infuse.name, into } = customInit;
  const { [name]: infusion } = {
    [name](this: void, ...options: TOptions) {
      return infuse(...options);
    },
  } as { [key: typeof name]: DataInfusion<T, TOptions> };

  if (into) {
    infusion.DataInfusion$into = <TMix extends DataMix>(
      mixer: DataMixer<TMix>,
      infuse: DataInfusion<T, TOptions>,
    ): DataInfusion.Infuser<T, TOptions, TMix> => {
      const infuserInit: DataInfusion.Infuser.Init<T, TOptions, TMix> = into(mixer, infuse);
      const prevInfuser = prevInto?.(mixer, infuse);
      const prevWatch = prevInfuser?.watch;

      if (DataInfusion$isInfuser(infuserInit)) {
        if (!prevWatch) {
          return infuserInit;
        }

        const { watch } = infuserInit;

        if (!watch) {
          return prevInfuser;
        }

        return {
          ...infuserInit,
          watch(mix: TMix) {
            return input => watch(mix)(prevWatch(mix)(input));
          },
        };
      }

      return {
        ...infuserInit,
        watch<TUpdate extends DataAdmix.Update<T, TOptions>>(
          mix: TMix,
        ): DataSeep<TUpdate, DataAdmix.Update<T, TOptions>> {
          const prevUpdateSeep = prevInfuser?.watch?.(mix);
          const dataSeep: DataSeep<T> = infuserInit.seep(mix);
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

          if (prevUpdateSeep) {
            return faucet => updateDataSeep(prevUpdateSeep(faucet));
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
   * Data infusion initializer.
   *
   * Used to {@link DataInfusion:function create} custom data infusion.
   *
   * @typeParam T - Infused data type. I.e. the type of data poured by created faucet.
   * @typeParam TOptions - Tuple type representing infusion options.
   */
  export type Init<T, TOptions extends unknown[]> = CustomInit<T, TOptions> | SeepInit<T>;

  /**
   * Data seep infusion initializer.
   *
   * This is a shorthand variant of initializer to use in instead of {@link CustomInit fully customized} one.
   *
   * @typeParam T - Infused data type. I.e. the type of data poured by created faucet.
   */
  export interface SeepInit<in out T> {
    /**
     * Function name of custom data infusion.
     *
     * @defaultValue Original infusion function name.
     */
    readonly name?: string | undefined;

    /**
     * Infused data seep.
     */
    readonly seep: DataSeep<T>;
  }

  /**
   * Fully customized data infusion initializer.
   *
   * @typeParam T - Infused data type. I.e. the type of data poured by created faucet.
   * @typeParam TOptions - Tuple type representing infusion options.
   */
  export interface CustomInit<out T, in TOptions extends unknown[]> {
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
     * @param mixer - Data mixer the data infused into.
     * @param infuse - Customized infusion.
     *
     * @returns Initializer of custom data infuser.
     */
    into?<TMix extends DataMix>(
      this: void,
      mixer: DataMixer<TMix>,
      infuse: DataInfusion<T, TOptions>,
    ): DataInfusion.Infuser.Init<T, TOptions, TMix>;
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

  export namespace Infuser {
    /**
     * Initializer of {@link Infuser custom data infuser}.
     *
     * @typeParam T - Infused data type. I.e. the type of data poured by created faucet.
     * @typeParam TOptions - Tuple type representing infusion options.
     * @typeParam TMix - Type of data mix the data infused into.
     */
    export type Init<T, TOptions extends unknown[], TMix extends DataMix = DataMix> =
      | Infuser<T, TOptions, TMix>
      | SeepInit<T, TMix>;

    /**
     * Data seep infuser initializer.
     *
     * This is a shorthand variant of initializer to use in instead of {@link Infuser:interface fully customized} one.
     *
     * @typeParam T - Infused data type. I.e. the type of data poured by created faucet.
     * @typeParam TMix - Type of data mix the data infused into.
     */
    export interface SeepInit<out T, in out TMix extends DataMix = DataMix> {
      /**
       * Creates infused data seep.
       *
       * This is a convenience option that produces an additional data seep of {@link Infuser:interface#watch admix
       * updates}.
       *
       * @param mix - Source data mix.
       *
       * @returns Infused data seep.
       */
      seep<TData extends T>(mix: TMix): DataSeep<TData, T>;
    }
  }
}

function DataInfusion$isSeepInit<T, TOptions extends unknown[]>(
  init: DataInfusion.Init<T, TOptions>,
): init is DataInfusion.SeepInit<T> {
  return 'seep' in init && typeof init.seep === 'function';
}

function DataInfusion$isInfuser<T, TOptions extends unknown[], TMix extends DataMix>(
  init: DataInfusion.Infuser.Init<T, TOptions, TMix>,
): init is DataInfusion.Infuser<T, TOptions, TMix> {
  return !('seep' in init && typeof init.seep === 'function');
}

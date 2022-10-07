import { Supply } from '@proc7ts/supply';
import { DataFaucet, IntakeFaucet } from '../../data-faucet.js';
import { withAll } from '../../infusions/with-all.js';
import { withValue } from '../../infusions/with-value.js';
import { ValueJoint } from '../../joints/value-joint.js';
import { orSeep } from '../../seeps/or.seep.js';
import { BlendedAdmix } from '../blended.admix.js';
import { DataAdmix } from '../data-admix.js';
import { DataMix } from '../data-mix.js';

/**
 * @internal
 */
export class ArrayAdmix<
  out T,
  in out TOptions extends unknown[],
  in out TMix extends DataMix = DataMix,
> implements BlendedAdmix<T[], TOptions, TMix> {

  readonly #supply: Supply | undefined;
  readonly #admix: BlendedAdmix<T[], TOptions, TMix>;

  constructor(admix: DataAdmix<T[], TOptions, TMix>) {
    const { supply = new Supply() } = admix;

    this.#supply = supply;
    this.#admix = BlendedAdmix(admix);
  }

  get supply(): Supply | undefined {
    return this.#supply;
  }

  blend(
    context: DataAdmix.AdditionContext<T[], TOptions, TMix>,
  ): DataAdmix.Blend<T[], TOptions, TMix> {
    const blend = this.#admix.blend(context);

    return new ArrayAdmix$Blend(context, blend.supply).addBlend(blend, context.supply);
  }

  replace(
    context: DataAdmix.ReplacementContext<T[], TOptions, TMix>,
  ): DataAdmix.Blend<T[], TOptions, TMix> {
    const { replaced } = context;
    const { blend } = replaced;

    if (blend instanceof ArrayAdmix$Blend) {
      return blend.extend(this);
    }

    return new ArrayAdmix$Blend(context, replaced.supply).addBlend(blend, replaced.supply);
  }

}

class ArrayAdmix$Blend<
  in out T,
  in out TOptions extends unknown[],
  in out TMix extends DataMix = DataMix,
> implements DataAdmix.Blend<T[], TOptions, TMix> {

  readonly #context: DataAdmix.AdditionContext<T[], TOptions, TMix>;
  readonly #supply: Supply;
  readonly #blends = new ValueJoint<Map<Supply, DataAdmix.Blend<T[], TOptions, TMix>>>(new Map());

  constructor(context: DataAdmix.AdditionContext<T[], TOptions, TMix>, supply = new Supply()) {
    this.#context = context;
    this.#supply = supply;
    this.#blends.supply.as(supply);
  }

  get supply(): Supply {
    return this.#supply;
  }

  pour(mix: TMix): IntakeFaucet<T[]> {
    return async (sink, sinkSupply) => {
      await this.#blends.faucet(async blends => {
        let numBlends = 0;
        const faucets: Record<number, IntakeFaucet<T[]>> = {};

        for (const blend of blends.values()) {
          faucets[numBlends++] = orEmptyArray(blend.pour(mix));
        }

        await withAll(faucets)(async (arrays: Record<number, T[]>) => {
          const array: T[] = [];

          for (let i = 0; i < numBlends; ++i) {
            array.push(...arrays[i]);
          }

          await sink(array);
        }, sinkSupply);
      }, sinkSupply);
    };
  }

  extend(admix: DataAdmix<T[], TOptions, TMix>): this {
    if (admix.blend) {
      const { supply = new Supply() } = admix;
      const blend = admix.blend(this.#context);

      this.addBlend(blend, supply);
    }

    return this;
  }

  addBlend(blend: DataAdmix.Blend<T[], TOptions, TMix>, supply: Supply): this {
    blend.supply.as(this.supply);

    const keySupply = new Supply().as(supply).needs(this.supply);
    const blends = this.#blends.value;

    blends.set(keySupply, blend);
    this.#blends.add(blends);
    keySupply.whenOff(() => this.#removeBlend(keySupply));

    return this;
  }

  #removeBlend(keySupply: Supply): void {
    const blends = this.#blends.value;

    blends.delete(keySupply);

    this.#blends.add(blends);
  }

}

const orEmptyArray: <T>(input: IntakeFaucet<T[]>) => DataFaucet<T[]> = orSeep<unknown[]>(
  withValue([]),
) as <T>(input: IntakeFaucet<T[]>) => DataFaucet<T[]>;

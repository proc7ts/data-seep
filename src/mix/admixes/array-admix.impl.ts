import { Supply } from '@proc7ts/supply';
import { DataFaucet, IntakeFaucet } from '../../data-faucet.js';
import { withAll } from '../../infusions/with-all.js';
import { withValue } from '../../infusions/with-value.js';
import { ValueJoint } from '../../joints/value-joint.js';
import { mapSeep } from '../../seeps/map.seep.js';
import { orSeep } from '../../seeps/or.seep.js';
import { switchSeep } from '../../seeps/switch.seep.js';
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

  readonly #supply: Supply;
  readonly #admix: BlendedAdmix<T[], TOptions, TMix>;

  constructor(admix: DataAdmix<T[], TOptions, TMix>) {
    this.#admix = BlendedAdmix(admix);

    const { supply = new Supply() } = this.#admix;

    this.#supply = supply;
  }

  get supply(): Supply {
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
      return blend.addAdmix(this.#admix, this.supply);
    }

    return new ArrayAdmix$Blend(context)
      .addBlend(blend, replaced.supply)
      .addAdmix(this.#admix, this.supply);
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
    return switchSeep((blends: Map<Supply, DataAdmix.Blend<T[], TOptions, TMix>>) => {
      let numBlends = 0;
      const faucets: Record<number, IntakeFaucet<T[]>> = {};

      for (const blend of blends.values()) {
        faucets[numBlends++] = orEmptyArray(blend.pour(mix));
      }

      return mapSeep((arrays: Record<number, T[]>) => {
        const array: T[] = [];

        for (let i = 0; i < numBlends; ++i) {
          array.push(...arrays[i]);
        }

        return array;
      })(withAll(faucets));
    })(this.#blends.faucet);
  }

  extend(admix: DataAdmix<T[], TOptions, TMix>): this {
    admix = BlendedAdmix(admix);

    const { supply = new Supply() } = admix;

    return this.addAdmix(admix, supply);
  }

  addAdmix(admix: BlendedAdmix<T[], TOptions, TMix>, supply: Supply): this {
    const blend = admix.blend(this.#context);

    return this.addBlend(blend, supply);
  }

  addBlend(blend: DataAdmix.Blend<T[], TOptions, TMix>, supply: Supply): this {
    blend.supply.as(this.supply);

    const keySupply = new Supply().as(supply).needs(this.supply);
    const blends = this.#blends.value;

    blends.set(keySupply, blend);
    this.#blends.pass(blends);
    keySupply.whenOff(() => this.#removeBlend(keySupply));

    return this;
  }

  #removeBlend(keySupply: Supply): void {
    const blends = this.#blends.value;

    blends.delete(keySupply);

    this.#blends.pass(blends);
  }

}

const orEmptyArray: <T>(input: IntakeFaucet<T[]>) => DataFaucet<T[]> = orSeep<unknown[]>(
  withValue([]),
) as <T>(input: IntakeFaucet<T[]>) => DataFaucet<T[]>;

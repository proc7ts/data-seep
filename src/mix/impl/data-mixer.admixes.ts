import { neverSupply } from '@proc7ts/supply';
import { DataInfusion } from '../../data-infusion.js';
import { ValueJoint } from '../../joints/value-joint.js';
import { DataMix } from '../data-mix.js';
import { DataAdmix$Entry, DataAdmix$Removed } from './data-admix.entry.js';

/**
 * @internal
 */
export class DataMixer$Admixes<TMix extends DataMix> {

  readonly #admixes = new Map<
    DataInfusion<unknown, unknown[]>,
    ValueJoint<DataAdmix$Entry<unknown, unknown[], TMix> | DataAdmix$Removed>
  >();

  joint<T, TOptions extends unknown[]>(
    infusion: DataInfusion<T, TOptions>,
  ): ValueJoint<DataAdmix$Entry<T, TOptions, TMix> | DataAdmix$Removed> {
    let admixJoint = this.#admixes.get(infusion as DataInfusion<unknown, unknown[]>) as ValueJoint<
      DataAdmix$Entry<T, TOptions, TMix> | DataAdmix$Removed
    >;

    if (!admixJoint) {
      admixJoint = new ValueJoint<DataAdmix$Entry<T, TOptions, TMix> | DataAdmix$Removed>({
        admixSupply: neverSupply(),
      });
      this.#admixes.set(
        infusion as DataInfusion<unknown, unknown[]>,
        admixJoint as ValueJoint<DataAdmix$Entry<unknown, unknown[], TMix> | DataAdmix$Removed>,
      );
    }

    return admixJoint;
  }

}

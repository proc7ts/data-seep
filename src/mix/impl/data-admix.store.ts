import { DataInfusion } from '../../data-infusion.js';
import { DataMix } from '../data-mix.js';
import { DataMixer } from '../data-mixer.js';
import { DataAdmix$Slot } from './data-admix.slot.js';

/**
 * @internal
 */
export class DataAdmix$Store<TMix extends DataMix> {

  readonly #mixer: DataMixer<TMix>;
  readonly #admixes = new Map<
    DataInfusion<unknown, unknown[]>,
    DataAdmix$Slot<unknown, unknown[], TMix>
  >();

  constructor(mixer: DataMixer<TMix>) {
    this.#mixer = mixer;
  }

  slotFor<T, TOptions extends unknown[]>(
    infusion: DataInfusion<T, TOptions>,
  ): DataAdmix$Slot<T, TOptions, TMix> {
    let slot = this.#admixes.get(infusion as DataInfusion<unknown, unknown[]>) as
      | DataAdmix$Slot<T, TOptions, TMix>
      | undefined;

    if (!slot) {
      slot = new DataAdmix$Slot(this.#mixer, infusion);

      this.#admixes.set(
        infusion as DataInfusion<unknown, unknown[]>,
        slot as unknown as DataAdmix$Slot<unknown, unknown[], TMix>,
      );
    }

    return slot;
  }

}

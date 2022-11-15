import { neverSupply } from '@proc7ts/supply';
import { DataFaucet } from '../../data-faucet.js';
import { DataInfusion } from '../../data-infusion.js';
import { ValueJoint } from '../../joints/value-joint.js';
import { DataAdmix } from '../data-admix.js';
import { DataMix } from '../data-mix.js';
import { DataMixer } from '../data-mixer.js';
import { DataAdmix$Entry, DataAdmix$Removed } from './data-admix.entry.js';

export class DataAdmix$Slot<T, TOptions extends unknown[], TMix extends DataMix> {

  readonly #mixer: DataMixer<TMix>;
  readonly #infusion: DataInfusion<T, TOptions>;
  readonly #infused: DataInfusion.Infuser<T, TOptions, TMix>;
  readonly #joint: ValueJoint<DataAdmix$Entry<T, TOptions, TMix> | DataAdmix$Removed>;

  constructor(mixer: DataMixer<TMix>, infusion: DataInfusion<T, TOptions>) {
    this.#mixer = mixer;
    this.#infusion = infusion;
    this.#infused = infusion.DataInfusion$into?.<TMix>(mixer, infusion) || {};
    this.#joint = new ValueJoint({
      admixSupply: neverSupply(),
    });
  }

  watch(mix: TMix): DataFaucet<DataAdmix.Update<T, TOptions>> {
    const faucet: DataFaucet<DataAdmix.Update<T, TOptions>> = async (sink, sinkSupply) => {
      await this.#joint.faucet(async entry => {
        if (entry.pour) {
          await sink({
            infuse: this.#infusion,
            supply: entry.admixSupply,
            faucet: entry.pour(mix),
          });
        } else {
          await sink({ infuse: this.#infusion, supply: entry.admixSupply });
        }
      }, sinkSupply);
    };

    return this.#infused.watch?.(mix)(faucet) ?? faucet;
  }

  admix(admix: DataAdmix<T, TOptions, TMix>): DataAdmix.Handle {
    const prevEntry = this.#joint.value;
    const entry = prevEntry.extend
      ? prevEntry.extend(this.#mixer, this.#infusion, admix)
      : DataAdmix$Entry.create(this.#mixer, this.#infusion, admix);

    if (!entry) {
      const supply = admix.supply!;

      return {
        supply,
        whenSank: () => supply.whenDone(),
      };
    }

    const { admixSupply: supply } = entry;
    const { whenSank } = this.#joint.pass(entry);

    supply.whenOff(() => {
      const replacement = entry.drop();

      if (replacement) {
        this.#joint.pass(replacement);
      }
    });

    return { supply: entry.admixSupply, whenSank };
  }

}

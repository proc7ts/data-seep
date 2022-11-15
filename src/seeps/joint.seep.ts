import { noop } from '@proc7ts/primitives';
import { SupplyOut } from '@proc7ts/supply';
import { IntakeFaucet } from '../data-faucet.js';
import { DataSeep } from '../data-seep.js';
import { DataSink } from '../data-sink.js';
import { BufferJoint } from '../joints/buffer-joint.js';
import { DataJoint } from '../joints/data-joint.js';

/**
 * Creates data seep that pours data through the {@link DataJoint joint}.
 *
 * The output faucet creates joint and starts sinking values through it once the first sink started, and destroys
 * the faucet once the last sink completed.
 *
 * @typeParam TIn - Input data type.
 * @typeParam TOut - Output data type.
 * @param createJoint - Data joint creator function. By default, creates a {@link BufferJoint} with buffer capacity
 * of `1`.
 *
 * @returns New data seep.
 */
export function jointSeep<TIn extends TOut, TOut = TIn>(
  createJoint: () => DataJoint<TIn, TOut> = () => new BufferJoint(1),
): DataSeep<TIn, TOut> {
  return input => {
    let state: JointSeep$State<TIn, TOut> | undefined;

    return async (sink, sinkSupply) => {
      if (!state) {
        const joint = createJoint();

        state = new JointSeep$State(input, joint);
        joint.supply.whenOff(() => {
          state = undefined;
        });
      }

      await state.pour(sink, sinkSupply);
    };
  };
}

class JointSeep$State<in TIn extends TOut, out TOut = TIn> {

  readonly #joint: DataJoint<TIn, TOut>;
  #refCount = 0;
  readonly #whenSank: Promise<void>;

  constructor(input: IntakeFaucet<TIn>, joint: DataJoint<TIn, TOut>) {
    this.#joint = joint;
    this.#whenSank = input(joint.sink, joint.supply);
  }

  async pour(sink: DataSink<TOut>, sinkSupply: SupplyOut | undefined): Promise<void> {
    ++this.#refCount;

    let done = (): void => {
      done = noop; // Make sure this is called only once.
      if (!--this.#refCount) {
        this.#joint.supply.done();
      }
    };

    sinkSupply?.whenOff(() => done()); // Decrease ref count immediately.

    try {
      await this.#joint.faucet(sink, sinkSupply);
    } finally {
      done(); // Ensure ref count decreased even without sink supply.
    }

    if (!this.#refCount) {
      // Last sink.
      // Wait for all data sank by joint.
      return await this.#whenSank;
    }
  }

}

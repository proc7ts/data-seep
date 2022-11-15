import { DataSeep } from '../data-seep.js';
import { BufferJoint } from '../joints/buffer-joint.js';
import { DataJoint } from '../joints/data-joint.js';

/**
 * Creates data seep that pours data through the {@link DataJoint joint}.
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
    const joint = createJoint();

    const promise = input(joint.sink, joint.supply);

    return async (sink, sinkSupply) => {
      await Promise.race([promise, joint.faucet(sink, sinkSupply)]);
    };
  };
}

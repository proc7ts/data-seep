import { Faucet } from '../faucet.js';
import { sinkOnce } from '../impl/sink-once.js';
import { Sink } from '../sink.js';
import { endInflow, inflowHandle, startInflow } from './inflow.impl.js';

export async function withInflow(sink: Sink<Faucet<void, []>>): Promise<void> {
  const inflow = inflowHandle();

  return sinkOnce(sink, async (inflowSink: Sink<void>): Promise<void> => {
    const prevInflow = startInflow(inflow);

    try {
      return sinkOnce(inflowSink);
    } finally {
      endInflow(prevInflow);
    }
  });
}

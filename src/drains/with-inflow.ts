import { Faucet } from '../faucet.js';
import { sinkOnce } from '../impl/sink-once.js';
import { Sink } from '../sink.js';
import { getInflow, setInflow, startInflow } from './inflow.impl.js';

export async function withInflow(sink: Sink<Faucet<void, []>>): Promise<void>;
export async function withInflow(name: string, sink: Sink<Faucet<void>>): Promise<void>;
export async function withInflow(
  nameOrSink: Sink<Faucet<void>> | string,
  sink?: Sink<Faucet<void>>,
): Promise<void> {
  let name: string | undefined;

  if (typeof nameOrSink === 'string') {
    name = nameOrSink;
  } else {
    sink = nameOrSink;
  }

  const baseInflow = getInflow();
  const inflow = startInflow(baseInflow, name);

  try {
    return sinkOnce(sink!, async (inflowSink: Sink<void>): Promise<void> => {
      const prevInflow = getInflow();

      setInflow(inflow);

      try {
        return sinkOnce(inflowSink);
      } finally {
        setInflow(prevInflow);
      }
    });
  } finally {
    setInflow(baseInflow);
  }
}

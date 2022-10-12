import { SupplyOut } from '@proc7ts/supply';
import { DataFaucet } from '../data-faucet.js';
import { DataSink } from '../data-sink.js';

/**
 * Returns data faucet that never pours anything to target sink.
 *
 * @returns Empty faucet.
 */
export function withNone<T = never>(): DataFaucet<T> {
  return noneFaucet;
}

function noneFaucet(_sink: DataSink<never>, _sinkSupply?: SupplyOut): Promise<void> {
  return Promise.resolve();
}

import { DataSink } from './data-sink.js';

export type DataFaucet<out TOut, in TIn extends unknown[]> =
    (this: void, ...args: [...TIn, DataSink<TOut>]) => Promise<void>;

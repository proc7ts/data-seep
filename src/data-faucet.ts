import { DataSink } from './data-sink.js';

export type DataFaucet<out TOut, in TIn> = (this: void, arg: TIn, sink: DataSink<TOut>) => Promise<void>;

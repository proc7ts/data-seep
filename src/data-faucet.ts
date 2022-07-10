import { Supply } from '@proc7ts/supply';
import { DataSink } from './data-sink.js';

export type DataFaucet<out TOut> = (sink: DataSink<TOut>, supply?: Supply) => Promise<void>;

export namespace DataFaucet {

  export type ValueType<TFaucet extends DataFaucet<unknown>> = TFaucet extends DataFaucet<infer T> ? T : never;

}

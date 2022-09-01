import { Supplier, Supply } from '@proc7ts/supply';

export type DataSink<in T> = (
  this: void,
  value: T,
  supply: Supply,
) => Supplier | Promise<Supplier | void> | void;

import { Sink } from '../sink.js';

export async function sinkOnce(sink: Sink<void | undefined>, data?: void): Promise<void>;
export async function sinkOnce<T>(sink: Sink<T>, data: T): Promise<void>;
export async function sinkOnce<T>(sink: Sink<T>, data: T): Promise<void> {
  await sink(data);
}

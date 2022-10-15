import { describe, expect, it } from '@jest/globals';
import { Supply, SupplyOut } from '@proc7ts/supply';
import { IntakeFaucet } from '../data-faucet.js';
import { DataSink } from '../data-sink.js';
import { withNone } from '../infusions/with-none.js';
import { BufferJoint } from '../joints/buffer-joint.js';
import { DataJoint } from '../joints/data-joint.js';
import { mergeSeep } from './merge.seep.js';

describe('mergeSeep', () => {
  it('merges values from output faucets', async () => {
    const sank: number[] = [];
    const inputs = new DataJoint<IntakeFaucet<number>>();

    const supply = new Supply();
    const promise = mergeSeep(
      (inputFaucet: IntakeFaucet<number>) => async (sink: DataSink<number>, sinkSupply: SupplyOut) => {
          await inputFaucet(sink, sinkSupply);
        },
    )(inputs.faucet)(value => {
      sank.push(value);
    }, supply);

    const input1 = new BufferJoint<number>();
    const input2 = new BufferJoint<number>();

    input1.pass(1);
    inputs.pass(input1.faucet);
    await new Promise(resolve => setImmediate(resolve));
    expect(sank).toEqual([1]);

    inputs.pass(withNone());
    await new Promise(resolve => setImmediate(resolve));
    expect(sank).toEqual([1]);

    input2.pass(2);
    inputs.pass(input2.faucet);
    await new Promise(resolve => setImmediate(resolve));
    expect(sank).toEqual([1, 2]);

    input2.pass(22);
    await new Promise(resolve => setImmediate(resolve));
    expect(sank).toEqual([1, 2, 22]);

    input1.pass(11);
    await new Promise(resolve => setImmediate(resolve));
    expect(sank).toEqual([1, 2, 22, 11]);

    supply.off();
    await promise;
  });
  it('pours nothing on empty input', async () => {
    const sank: number[] = [];

    await mergeSeep(
      (inputFaucet: IntakeFaucet<number>) => async (sink: DataSink<number>, sinkSupply: SupplyOut) => {
          await inputFaucet(sink, sinkSupply);
        },
    )(withNone())(value => {
      sank.push(value);
    });

    expect(sank).toHaveLength(0);
  });
  it('fails if any output faucet fail', async () => {
    const sank: number[] = [];
    const inputs = new DataJoint<IntakeFaucet<number>>();

    const error = 'test';
    const promise = mergeSeep(
      (inputFaucet: IntakeFaucet<number>) => async (sink: DataSink<number>, sinkSupply: SupplyOut) => {
          await inputFaucet(sink, sinkSupply);
        },
    )(inputs.faucet)(value => {
      sank.push(value);
      if (value > 10) {
        throw error;
      }
    });

    const input1 = new BufferJoint<number>();
    const input2 = new BufferJoint<number>();

    input1.pass(1);
    inputs.pass(input1.faucet);
    await new Promise(resolve => setImmediate(resolve));
    expect(sank).toEqual([1]);

    input2.pass(2);
    inputs.pass(input2.faucet);
    await new Promise(resolve => setImmediate(resolve));
    expect(sank).toEqual([1, 2]);

    input2.pass(22);
    await expect(promise).rejects.toBe(error);
    await new Promise(resolve => setImmediate(resolve));
    expect(sank).toEqual([1, 2, 22]);

    input1.pass(11);

    await new Promise(resolve => setImmediate(resolve));
    expect(sank).toEqual([1, 2, 22]);
  });
});

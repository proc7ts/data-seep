import { describe, expect, it } from '@jest/globals';
import { asis } from '@proc7ts/primitives';
import { Supply } from '@proc7ts/supply';
import { DataFaucet } from '../data-faucet.js';
import { BufferJoint } from '../joints/buffer-joint.js';
import { concatSeep } from './concat.seep.js';

describe('concatSeep', () => {
  it('concatenates outputs', async () => {
    const inputs = new BufferJoint<DataFaucet<number>>();
    const input1 = new BufferJoint<number>();
    const input2 = new BufferJoint<number>();

    inputs.pass(input1.faucet);
    inputs.pass(input2.faucet);

    const sank: number[] = [];
    const promise = concatSeep(asis<DataFaucet<number>>)(inputs.faucet)(value => {
      sank.push(value);
    });

    input1.pass(1.1);
    input2.pass(2.1);
    input1.pass(1.2);
    input2.pass(2.2);

    await new Promise(resolve => setImmediate(resolve));
    expect(sank).toEqual([1.1, 1.2]);

    input1.supply.off();
    await new Promise(resolve => setImmediate(resolve));
    expect(sank).toEqual([1.1, 1.2, 2.1, 2.2]);

    input2.supply.off();
    inputs.supply.off();
    await promise;
  });
  it('pours until supply cut off', async () => {
    const inputs = new BufferJoint<DataFaucet<number>>();
    const input1 = new BufferJoint<number>();
    const input2 = new BufferJoint<number>();

    inputs.pass(input1.faucet);
    inputs.pass(input2.faucet);

    const supply = new Supply();
    const sank: number[] = [];
    const promise = concatSeep(asis<DataFaucet<number>>)(inputs.faucet)(value => {
      sank.push(value);
    }, supply);

    input1.pass(1.1);
    input2.pass(2.1);
    input1.pass(1.2);
    input2.pass(2.2);

    await new Promise(resolve => setImmediate(resolve));
    expect(sank).toEqual([1.1, 1.2]);

    supply.off();
    input1.supply.off();
    await new Promise(resolve => setImmediate(resolve));
    expect(sank).toEqual([1.1, 1.2]);

    await promise;
  });
});

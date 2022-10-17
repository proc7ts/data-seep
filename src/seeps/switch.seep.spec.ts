import { describe, expect, it } from '@jest/globals';
import { Supply, SupplyOut } from '@proc7ts/supply';
import { IntakeFaucet } from '../data-faucet.js';
import { DataSink } from '../data-sink.js';
import { withValue } from '../infusions/with-value.js';
import { BufferJoint } from '../joints/buffer-joint.js';
import { DataJoint } from '../joints/data-joint.js';
import { switchSeep } from './switch.seep.js';

describe('switchSeep', () => {
  it('converts values', async () => {
    const sank: number[] = [];

    await switchSeep((value: number) => async (sink: DataSink<number>) => {
      await sink(value);
      await sink(-value);
    })(withValue(13))(value => {
      sank.push(value);
    });

    expect(sank).toEqual([13, -13]);
  });

  it('pours data by latest faucet', async () => {
    const sank: number[] = [];
    const inputs = new DataJoint<IntakeFaucet<number>>();

    const supply = new Supply();
    const promise = switchSeep(
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

    input2.pass(2);
    inputs.pass(input2.faucet);
    await new Promise(resolve => setImmediate(resolve));
    expect(sank).toEqual([1, 2]);

    input2.pass(22);
    await new Promise(resolve => setImmediate(resolve));
    expect(sank).toEqual([1, 2, 22]);

    input1.pass(11);
    await new Promise(resolve => setImmediate(resolve));
    expect(sank).toEqual([1, 2, 22]);

    supply.off();
    await promise;
  });
});

import { beforeEach, describe, expect, it } from '@jest/globals';
import { noop } from '@proc7ts/primitives';
import { neverSupply, Supply } from '@proc7ts/supply';
import { DataFaucet } from '../data-faucet.js';
import { DataJoint } from '../joints/data-joint.js';
import { mapSeep } from './map.seep.js';
import { seep } from './seep.js';
import { shareSeep } from './share.seep.js';

describe('shareSeep', () => {
  let input: DataJoint<number>;
  let output: DataFaucet<string>;

  beforeEach(() => {
    input = new DataJoint<number>();

    let counter = 0;

    output = seep(
      mapSeep((input: number) => `${input}.${++counter}`),
      shareSeep(),
    )(input.faucet);
  });

  it('pours input data', async () => {
    const sank: string[] = [];
    const promise = output(value => {
      sank.push(value);
    });

    input.pass(1);
    input.pass(2);
    await new Promise(resolve => setImmediate(resolve));
    expect(sank).toEqual(['1.1', '2.2']);

    input.supply.off();
    await promise;
  });
  it('pours input data until sink cut off', async () => {
    const sank: string[] = [];
    const supply = new Supply();
    const promise = output(value => {
      sank.push(value);
    }, supply);

    input.pass(1);
    input.pass(2);
    await new Promise(resolve => setImmediate(resolve));
    expect(sank).toEqual(['1.1', '2.2']);

    supply.off();
    await promise;
  });
  it('pours input data to multiple sinks', async () => {
    const supply1 = new Supply();
    const sank1: string[] = [];
    const promise1 = output(value => {
      sank1.push(value);
    }, supply1);

    input.pass(1);
    input.pass(2);
    await new Promise(resolve => setImmediate(resolve));
    expect(sank1).toEqual(['1.1', '2.2']);

    const sank2: string[] = [];
    const promise2 = output(value => {
      sank2.push(value);
    });

    const supply3 = new Supply();
    const sank3: string[] = [];
    const promise3 = output(value => {
      sank3.push(value);
    }, supply3);

    input.pass(3);
    input.pass(4);
    await new Promise(resolve => setImmediate(resolve));
    expect(sank1).toEqual(['1.1', '2.2', '3.3', '4.4']);
    expect(sank2).toEqual(['3.3', '4.4']);
    expect(sank3).toEqual(['3.3', '4.4']);

    supply1.off();
    input.pass(5);
    input.pass(6);
    await new Promise(resolve => setImmediate(resolve));
    await promise1;
    expect(sank1).toEqual(['1.1', '2.2', '3.3', '4.4']);
    expect(sank2).toEqual(['3.3', '4.4', '5.5', '6.6']);
    expect(sank3).toEqual(['3.3', '4.4', '5.5', '6.6']);

    supply3.off();
    input.pass(7);
    input.pass(8);
    await new Promise(resolve => setImmediate(resolve));
    await promise3;
    expect(sank1).toEqual(['1.1', '2.2', '3.3', '4.4']);
    expect(sank2).toEqual(['3.3', '4.4', '5.5', '6.6', '7.7', '8.8']);
    expect(sank3).toEqual(['3.3', '4.4', '5.5', '6.6']);

    input.supply.off();
    await promise2;
  });
  it('fails if one of sinks failed', async () => {
    const sank1: string[] = [];
    const promise1 = output(value => {
      sank1.push(value);
    });

    const error = new Error('Test');
    const promise2 = output(() => {
      throw error;
    });

    input.pass(0);

    await expect(promise2).rejects.toThrow(error);
    await expect(promise1).rejects.toThrow(error);
    expect(sank1).toEqual(['0.1']);
  });
  it('ignores cut off sink', async () => {
    const sank: string[] = [];

    await output(value => {
      sank.push(value);
    }, neverSupply());

    input.pass(0);

    await new Promise(resolve => setImmediate(resolve));
    expect(sank).toHaveLength(0);
  });
  it('fails on failed sink', async () => {
    const sank: string[] = [];

    const error = new Error();

    await expect(
      output(value => {
        sank.push(value);
      }, new Supply(noop).off(error)),
    ).rejects.toThrow(error);

    input.pass(0);

    await new Promise(resolve => setImmediate(resolve));
    expect(sank).toHaveLength(0);
  });
});

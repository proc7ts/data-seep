import { describe, expect, it } from '@jest/globals';
import { Supply } from '@proc7ts/supply';
import { DataJoint } from '../joints/data-joint.js';
import { jointSeep } from './joint.seep.js';

describe('jointSeep', () => {
  it('pours data', async () => {
    const source = new DataJoint<number>();
    const out = jointSeep<number>()(source.faucet);

    const supply1 = new Supply();
    const sank1: number[] = [];
    const whenSank1 = out(value => {
      sank1.push(value);
    }, supply1);

    source.pass(1);
    source.pass(2);
    source.pass(3);

    await new Promise<void>(resolve => setImmediate(resolve));
    expect(sank1).toEqual([1, 2, 3]);

    const sank2: number[] = [];
    const supply2 = new Supply();
    const whenSank2 = out(value => {
      sank2.push(value);
    }, supply2);

    await new Promise<void>(resolve => setImmediate(resolve));
    expect(sank1).toEqual([1, 2, 3]);
    expect(sank2).toEqual([3]);

    source.pass(4);

    await new Promise<void>(resolve => setImmediate(resolve));
    expect(sank1).toEqual([1, 2, 3, 4]);
    expect(sank2).toEqual([3, 4]);

    supply1.done();
    source.pass(5);

    await new Promise<void>(resolve => setImmediate(resolve));
    await whenSank1;
    expect(sank1).toEqual([1, 2, 3, 4]);
    expect(sank2).toEqual([3, 4, 5]);

    supply2.done();

    await whenSank2;
  });
  it('ignores poured data without sinks', async () => {
    const source = new DataJoint<number>();
    const out = jointSeep<number>()(source.faucet);

    const supply1 = new Supply();
    const sank1: number[] = [];
    const whenSank1 = out(value => {
      sank1.push(value);
    }, supply1);

    source.pass(1);
    source.pass(2);
    source.pass(3);

    await new Promise<void>(resolve => setImmediate(resolve));
    expect(sank1).toEqual([1, 2, 3]);

    supply1.off();

    const sank2: number[] = [];
    const supply2 = new Supply();
    const whenSank2 = out(value => {
      sank2.push(value);
    }, supply2);

    source.pass(4);

    await new Promise<void>(resolve => setImmediate(resolve));
    expect(sank1).toEqual([1, 2, 3]);
    expect(sank2).toEqual([4]); // Would be `[3, 4]` if buffered value reported.

    supply1.done();
    supply2.done();
    await whenSank1;
    await whenSank2;
  });
});

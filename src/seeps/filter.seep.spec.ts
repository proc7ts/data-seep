import { describe, expect, it } from '@jest/globals';
import { DataJoint } from '../joints/data-joint.js';
import { filterSeep } from './filter.seep.js';

describe('filterSeep', () => {
  it('pours values satisfying predicate', async () => {
    const input = new DataJoint<number>();
    const sank: number[] = [];
    const promise = filterSeep((value: number) => value > 0)(input.faucet)(value => {
      sank.push(value);
    });

    input.pass(1);
    input.pass(-1);
    input.pass(2);
    input.pass(3);
    input.pass(0);

    await new Promise(resolve => setImmediate(resolve));
    expect(sank).toEqual([1, 2, 3]);

    input.supply.off();
    await promise;
  });
});

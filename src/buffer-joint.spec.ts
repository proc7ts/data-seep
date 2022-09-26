import { describe, expect, it } from '@jest/globals';
import { BufferJoint } from './joints/buffer-joint.js';

describe('BufferJoint', () => {
  it('accepts custom buffer', async () => {
    const buffer: number[] = [];
    const joint = new BufferJoint(buffer);

    await joint.sink(1);
    await joint.sink(2);
    await joint.sink(3);

    expect(buffer).toEqual([1, 2, 3]);
  });

  describe('values', () => {
    it('initially empty', () => {
      expect([...new BufferJoint().values()]).toHaveLength(0);
    });
    it('always empty if capacity is zero', async () => {
      const joint = new BufferJoint<number>(0.99);

      await joint.sink(1);
      await joint.sink(2);
      await joint.sink(3);

      expect([...joint.values()]).toHaveLength(0);
      expect([...joint]).toHaveLength(0);
    });
    it('contains latest values', async () => {
      const joint = new BufferJoint<number>(2);

      await joint.sink(1);
      await joint.sink(2);
      await joint.sink(3);

      expect([...joint.values()]).toEqual([2, 3]);
      expect([...joint]).toEqual([2, 3]);

      await joint.sink(4);

      expect([...joint.values()]).toEqual([3, 4]);
      expect([...joint]).toEqual([3, 4]);
    });
  });

  describe('faucet', () => {
    it('pours nothing initially', async () => {
      const joint = new BufferJoint<number>();
      const sank: number[] = [];

      await joint.faucet(value => {
        sank.push(value);
      });

      expect(sank).toHaveLength(0);
    });
    it('pours all buffered values', async () => {
      const joint = new BufferJoint<number>(Infinity);
      const sank: number[] = [];

      await joint.sink(1);
      await joint.sink(2);
      await joint.sink(3);

      await joint.faucet(value => {
        sank.push(value);
      });

      expect(sank).toEqual([1, 2, 3]);
    });
    it('pours only latest values', async () => {
      const joint = new BufferJoint<number>(2);
      const sank: number[] = [];

      await joint.sink(1);
      await joint.sink(2);
      await joint.sink(3);
      await joint.sink(4);
      await joint.sink(5);

      await joint.faucet(value => {
        sank.push(value);
      });

      expect(sank).toEqual([4, 5]);

      await joint.sink(6);

      expect(sank).toEqual([4, 5, 6]);
    });
  });
});

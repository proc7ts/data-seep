import { beforeEach, describe, expect, it } from '@jest/globals';
import { BufferJoint } from './buffer-joint.js';

describe('BufferJoint', () => {
  it('accepts custom buffer', async () => {
    const buffer: { value: number; drop: () => void }[] = [];
    const joint = new BufferJoint<number>({
      add(value, drop) {
        buffer.push({ value, drop });
      },
      clear() {
        buffer.forEach(({ drop }) => drop());
        buffer.length = 0;
      },
      *[Symbol.iterator]() {
        for (const { value } of buffer) {
          yield value;
        }
      },
    });

    const promise = Promise.all([joint.sink(1), joint.sink(2), joint.sink(3)]);

    await new Promise<void>(resolve => setTimeout(resolve));
    expect([...joint]).toEqual([1, 2, 3]);

    joint.supply.done();
    expect(buffer).toHaveLength(0);

    await promise;
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
      const promise = Promise.all([joint.sink(1), joint.sink(2), joint.sink(3)]);

      await new Promise<void>(resolve => setTimeout(resolve));
      expect([...joint.values()]).toEqual([2, 3]);
      expect([...joint]).toEqual([2, 3]);

      const promise2 = joint.sink(4);

      await new Promise<void>(resolve => setTimeout(resolve));
      expect([...joint.values()]).toEqual([3, 4]);
      expect([...joint]).toEqual([3, 4]);

      joint.supply.done();
      await promise;
      await promise2;
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
      const promise = Promise.all([joint.sink(1), joint.sink(2), joint.sink(3)]);

      await new Promise<void>(resolve => setTimeout(resolve));
      await joint.faucet(value => {
        sank.push(value);
      });

      expect(sank).toEqual([1, 2, 3]);
      joint.supply.done();
      await promise;
    });
    it('pours only latest values', async () => {
      const joint = new BufferJoint<number>(3);
      const sank: number[] = [];

      const promise = Promise.all([
        joint.sink(1),
        joint.sink(2),
        joint.sink(3),
        joint.sink(4),
        joint.sink(5),
      ]);

      await new Promise<void>(resolve => setTimeout(resolve));
      await joint.faucet(value => {
        sank.push(value);
      });

      expect(sank).toEqual([3, 4, 5]);

      const promise2 = joint.sink(6);

      await new Promise<void>(resolve => setTimeout(resolve));
      expect([...joint]).toEqual([4, 5, 6]);
      expect(sank).toEqual([3, 4, 5, 6]);

      joint.supply.done();
      await promise;
      await promise2;
    });
  });

  describe('with empty buffer', () => {
    let joint: BufferJoint<number>;

    beforeEach(() => {
      joint = new BufferJoint(0.99);
    });

    describe('values', () => {
      it('always empty', async () => {
        await joint.sink(1);
        await joint.sink(2);
        await joint.sink(3);

        expect([...joint.values()]).toHaveLength(0);
        expect([...joint]).toHaveLength(0);
      });
    });

    describe('faucet', () => {
      it('pours nothing', async () => {
        const sank: number[] = [];

        const promise = Promise.all([
          joint.sink(1),
          joint.sink(2),
          joint.sink(3),
          joint.sink(4),
          joint.sink(5),
        ]);

        await new Promise<void>(resolve => setTimeout(resolve));
        await joint.faucet(value => {
          sank.push(value);
        });

        expect(sank).toHaveLength(0);

        const promise2 = joint.sink(6);

        await new Promise<void>(resolve => setTimeout(resolve));
        expect([...joint]).toHaveLength(0);
        expect(sank).toEqual([6]);

        joint.supply.done();
        await promise;
        await promise2;
      });
    });
  });

  describe('with infinite buffer', () => {
    let joint: BufferJoint<number>;

    beforeEach(() => {
      joint = new BufferJoint(Infinity);
    });

    it('initially empty', () => {
      expect([...joint.values()]).toHaveLength(0);
    });
    it('contains all values', async () => {
      const promise = Promise.all([joint.sink(1), joint.sink(2), joint.sink(3)]);

      await new Promise<void>(resolve => setTimeout(resolve));
      expect([...joint.values()]).toEqual([1, 2, 3]);
      expect([...joint]).toEqual([1, 2, 3]);

      const promise2 = joint.sink(4);

      await new Promise<void>(resolve => setTimeout(resolve));
      expect([...joint.values()]).toEqual([1, 2, 3, 4]);
      expect([...joint]).toEqual([1, 2, 3, 4]);

      joint.supply.done();
      await promise;
      await promise2;
    });

    describe('faucet', () => {
      it('pours nothing initially', async () => {
        const sank: number[] = [];

        await joint.faucet(value => {
          sank.push(value);
        });

        expect(sank).toHaveLength(0);
      });
      it('pours all values', async () => {
        const sank: number[] = [];
        const promise = Promise.all([joint.sink(1), joint.sink(2), joint.sink(3)]);

        await new Promise<void>(resolve => setTimeout(resolve));
        await joint.faucet(value => {
          sank.push(value);
        });

        expect(sank).toEqual([1, 2, 3]);
        joint.supply.done();
        await promise;
      });
    });
  });

  describe('with single-valued buffer', () => {
    let joint: BufferJoint<number>;

    beforeEach(() => {
      joint = new BufferJoint(1);
    });

    describe('values', () => {
      it('initially empty', () => {
        expect([...joint.values()]).toHaveLength(0);
      });
      it('contains latest value', async () => {
        const promise = Promise.all([joint.sink(1), joint.sink(2), joint.sink(3)]);

        await new Promise<void>(resolve => setTimeout(resolve));
        expect([...joint.values()]).toEqual([3]);
        expect([...joint]).toEqual([3]);

        const promise2 = joint.sink(4);

        await new Promise<void>(resolve => setTimeout(resolve));
        expect([...joint.values()]).toEqual([4]);
        expect([...joint]).toEqual([4]);

        joint.supply.done();
        await promise;
        await promise2;
      });
    });

    describe('faucet', () => {
      it('pours nothing initially', async () => {
        const sank: number[] = [];

        await joint.faucet(value => {
          sank.push(value);
        });

        expect(sank).toHaveLength(0);
      });
      it('pours latest buffered value', async () => {
        const sank: number[] = [];
        const promise = Promise.all([joint.sink(1), joint.sink(2), joint.sink(3)]);

        await new Promise<void>(resolve => setTimeout(resolve));
        await joint.faucet(value => {
          sank.push(value);
        });

        expect(sank).toEqual([3]);
        joint.supply.done();
        await promise;
      });
      it('pours only latest value', async () => {
        const sank: number[] = [];

        const promise = Promise.all([
          joint.sink(1),
          joint.sink(2),
          joint.sink(3),
          joint.sink(4),
          joint.sink(5),
        ]);

        await new Promise<void>(resolve => setTimeout(resolve));
        await joint.faucet(value => {
          sank.push(value);
        });

        expect(sank).toEqual([5]);

        const promise2 = joint.sink(6);

        await new Promise<void>(resolve => setTimeout(resolve));
        expect([...joint]).toEqual([6]);
        expect(sank).toEqual([5, 6]);

        joint.supply.done();
        await promise;
        await promise2;
      });
    });
  });
});

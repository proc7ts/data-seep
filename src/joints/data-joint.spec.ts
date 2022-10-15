import { describe, expect, it } from '@jest/globals';
import { PromiseResolver } from '@proc7ts/async';
import { noop } from '@proc7ts/primitives';
import { Supply } from '@proc7ts/supply';
import { DataSink } from '../data-sink.js';
import { DataJoint } from './data-joint.js';

describe('DataJoint', () => {
  describe('sink', () => {
    it('pours values to joint faucet', async () => {
      const joint = new DataJoint<number>();
      const sank: number[] = [];
      const whenSank = joint.faucet(value => {
        sank.push(value);
      });

      const promise = Promise.all([joint.sink(1), joint.sink(2), joint.sink(3)]);

      await new Promise<void>(resolve => setTimeout(resolve));
      expect(sank).toEqual([1, 2, 3]);

      joint.supply.done();
      await promise;
      await whenSank;
    });
    it('stops pouring values to removed sink', async () => {
      const joint = new DataJoint<number>();
      const sank: number[] = [];
      const sinkSupply = new Supply();

      const whenSank1 = joint.faucet(value => {
        sank.push(value);
      });
      const whenSank2 = joint.faucet(value => {
        sank.push(-value);
      }, sinkSupply);

      const firstPoured = new PromiseResolver();
      const secondPoured = new PromiseResolver();
      const promise = Promise.all([
        (async () => {
          firstPoured.resolve();
          await joint.sink(1);
        })(),
        (async () => {
          await firstPoured.whenDone();
          sinkSupply.done();
          secondPoured.resolve();
          await joint.sink(2);
        })(),
        (async () => {
          await secondPoured.whenDone();
          await joint.sink(3);
        })(),
      ]);

      await whenSank2;
      await new Promise<void>(resolve => setTimeout(resolve));
      expect(sank).toEqual([1, -1, 2, 3]);

      joint.supply.done();
      await promise;
      await whenSank1;
    });
  });

  describe('faucet', () => {
    it('add unaccepted sinks', async () => {
      const error = new Error('Rejected!');
      let added = false;

      class TestJoint extends DataJoint<number> {

        protected override sinkAdded(): void {
          if (added) {
            throw error;
          }
          added = true;
        }

}

      const joint = new TestJoint();
      const sank: number[] = [];

      const whenSank = joint.faucet(value => {
        sank.push(value);
      });

      await expect(
        joint.faucet(value => {
          sank.push(-value);
        }),
      ).rejects.toThrow(error);

      await joint.sink(1);
      await joint.sink(2);
      await joint.sink(3);

      expect(sank).toEqual([1, -1, 2, -2, 3, -3]);
      joint.supply.off();
      await whenSank;
    });
    it('ignores removed sinks', async () => {
      const error = new Error('Rejected!');
      let added = false;

      class TestJoint extends DataJoint<number> {

        protected override sinkAdded(_sink: DataSink<number>, sinkSupply: Supply): void {
          if (added) {
            sinkSupply.fail(error);
          }
          added = true;
        }

}

      const joint = new TestJoint();
      const sank: number[] = [];

      const whenSank1 = joint.faucet(value => {
        sank.push(value);
      });

      await expect(
        joint.faucet(value => {
          sank.push(-value);
        }),
      ).rejects.toThrow(error);

      await joint.sink(1);
      await joint.sink(2);
      await joint.sink(3);

      expect(sank).toEqual([1, 2, 3]);

      joint.supply.off();
      await whenSank1;
    });
  });

  describe('supply', () => {
    it('stops pouring values', async () => {
      const joint = new DataJoint<number>();
      const sank: number[] = [];

      const whenSank = joint.faucet(value => {
        sank.push(value);
      });

      await joint.sink(1);
      await joint.sink(2);
      joint.supply.done();
      await joint.sink(3);
      await whenSank;

      expect(sank).toEqual([1, 2]);
    });
    it('prevents adding new sinks when cut off', async () => {
      const joint = new DataJoint<number>();
      const error = new Error('Test!');

      joint.supply.whenOff(noop);
      joint.supply.off(error);

      await expect(joint.faucet(noop)).rejects.toThrow(error);
    });
    it('prevents pouring new data when cut off', async () => {
      const joint = new DataJoint<number>();
      const error = new Error('Test!');
      const sank: number[] = [];

      const whenSank = joint.faucet(value => {
        sank.push(value);
      });

      joint.supply.whenOff(noop);
      joint.supply.off(error);
      await expect(whenSank).rejects.toThrow(error);

      await expect(joint.sink(1)).rejects.toThrow(error);
      await expect(joint.sink(2)).rejects.toThrow(error);
      await expect(joint.sink(3)).rejects.toThrow(error);

      expect(sank).toHaveLength(0);
    });
  });
});

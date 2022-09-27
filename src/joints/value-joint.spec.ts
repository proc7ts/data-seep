import { describe, expect, it } from '@jest/globals';
import { ValueJoint } from './value-joint.js';

describe('ValueJoint', () => {
  describe('value', () => {
    it('contains initial value', () => {
      const joint = new ValueJoint(13);

      expect(joint.value).toBe(13);
    });
    it('contains last accepted value', async () => {
      const joint = new ValueJoint(0);
      const promise = Promise.all([joint.sink(1), joint.sink(2), joint.sink(3)]);

      await new Promise<void>(resolve => setTimeout(resolve));

      expect(joint.value).toBe(3);

      joint.supply.done();
      await promise;
    });
    it('contains initial value after supply cut off', async () => {
      const joint = new ValueJoint(0);
      const promise = Promise.all([joint.sink(1), joint.sink(2), joint.sink(3)]);

      await new Promise<void>(resolve => setTimeout(resolve));

      joint.supply.done();
      await promise;

      expect(joint.value).toBe(0);
    });
  });

  describe('faucet', () => {
    it('pours initial value', async () => {
      const joint = new ValueJoint(13);
      let sank: number | undefined;

      await joint.faucet(value => {
        sank = value;
      });

      expect(sank).toBe(13);
    });
    it('pours last accepted value', async () => {
      const joint = new ValueJoint(0);
      let sank: number | undefined;

      const promise = Promise.all([joint.sink(1), joint.sink(2), joint.sink(3)]);

      await new Promise<void>(resolve => setTimeout(resolve));
      await joint.faucet(value => {
        sank = value;
      });

      expect(sank).toBe(3);

      joint.supply.done();
      await promise;
    });
  });
});

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

      await joint.sink(1);
      await joint.sink(2);
      await joint.sink(3);

      expect(joint.value).toBe(3);
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

      await joint.sink(1);
      await joint.sink(2);
      await joint.sink(3);

      await joint.faucet(value => {
        sank = value;
      });

      expect(sank).toBe(3);
    });
  });
});

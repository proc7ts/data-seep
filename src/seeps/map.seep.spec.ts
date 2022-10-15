import { describe, expect, it } from '@jest/globals';
import { withValue } from '../infusions/with-value.js';
import { mapSeep } from './map.seep.js';

describe('mapSeep', () => {
  it('converts input values', async () => {
    let sank: number | undefined;

    await mapSeep((value: number) => -value)(withValue(13))(value => {
      sank = value;
    });

    expect(sank).toBe(-13);
  });
});

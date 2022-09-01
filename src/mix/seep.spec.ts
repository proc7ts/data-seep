import { describe, expect, it } from '@jest/globals';
import { DataFaucet } from '../data-faucet.js';
import { withValue } from '../with-value.js';
import { DataMixer } from './data-mixer.js';
import { seep } from './seep.js';

describe('seep', () => {
  it('seeps with the given options', async () => {
    const mixer = new DataMixer();

    mixer.mix(withTestData, seep(12, 34));

    let sunk: number | undefined;

    await mixer.with(async mix => {
      await mix.flow(withTestData)(value => {
        sunk = value;
      });
    });

    expect(sunk).toBe(46);
  });

  function withTestData(first: number, second: number): DataFaucet<number> {
    return withValue(first + second);
  }
});

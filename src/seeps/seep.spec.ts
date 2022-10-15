import { describe, expect, it } from '@jest/globals';
import { Supply } from '@proc7ts/supply';
import { DataFaucet, IntakeFaucet } from '../data-faucet.js';
import { withValue } from '../infusions/with-value.js';
import { seep } from './seep.js';

describe('seep', () => {
  it('does not alter single seep', () => {
    expect(seep(testSeep1)).toBe(testSeep1);
  });
  it('merges 2 seeps', async () => {
    let sank: string | undefined;

    await seep(testSeep1, testSeep2)(withValue('test'))(value => {
      sank = value;
    });

    expect(sank).toBe('test.1.2');
  });
  it('merges 3 seeps', async () => {
    let sank: string | undefined;

    await seep(testSeep1, testSeep2, testSeep3)(withValue('test'))(value => {
      sank = value;
    });

    expect(sank).toBe('test.1.2.3');
  });

  function testSeep1(faucet: IntakeFaucet<string>): DataFaucet<string> {
    return async (sink, sinkSupply = new Supply()) => {
      await faucet(async value => {
        await sink(value + '.1');
      }, sinkSupply);
    };
  }

  function testSeep2(faucet: IntakeFaucet<string>): DataFaucet<string> {
    return async (sink, sinkSupply = new Supply()) => {
      await faucet(async value => {
        await sink(value + '.2');
      }, sinkSupply);
    };
  }

  function testSeep3(faucet: IntakeFaucet<string>): DataFaucet<string> {
    return async (sink, sinkSupply = new Supply()) => {
      await faucet(async value => {
        await sink(value + '.3');
      }, sinkSupply);
    };
  }
});

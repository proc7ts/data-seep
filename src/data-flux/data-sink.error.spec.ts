import { beforeEach, describe, expect, it } from '@jest/globals';
import { DataFaucet, FaucetKind } from '../data-faucet.js';
import { withValue } from '../with-value.js';
import { DataSinkError } from './data-sink.error.js';

describe('DataSinkError', () => {

  let error: DataSinkError;

  beforeEach(() => {
    error = new DataSinkError(
        undefined,
        {
          faucetKind: withTestData as FaucetKind<unknown, unknown[]>,
        },
    );
  });

  describe('name', () => {
    it('is `DataSinkError`', () => {
      expect(error.name).toBe('DataSinkError');
    });
  });
  describe('message', () => {
    it('has default value', () => {
      expect(error.message).toBe(`Can not sink withTestData`);
    });
  });
  describe('faucetKind', () => {
    it('is set to initial value', () => {
      expect(error.faucetKind).toBe(withTestData);
    });
  });

  function withTestData(value: number): DataFaucet<number> {
    return withValue(value);
  }
});

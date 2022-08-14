import { beforeEach, describe, expect, it } from '@jest/globals';
import { DataFaucet } from '../data-faucet.js';
import { DataInfusion } from '../data-infusion.js';
import { withValue } from '../with-value.js';
import { DataSinkError } from './data-sink.error.js';

describe('DataSinkError', () => {

  let error: DataSinkError;

  beforeEach(() => {
    error = new DataSinkError(
        undefined,
        {
          infusion: withTestData as DataInfusion<unknown, unknown[]>,
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
      expect(error.infusion).toBe(withTestData);
    });
  });

  function withTestData(value: number): DataFaucet<number> {
    return withValue(value);
  }
});

import { beforeEach, describe, expect, it } from '@jest/globals';
import { DataFaucet } from '../data-faucet.js';
import { DataInfusion } from '../data-infusion.js';
import { withValue } from '../with-value.js';
import { DataInfusionError } from './data-infusion.error.js';

describe('DataInfusionError', () => {
  let error: DataInfusionError;

  beforeEach(() => {
    error = new DataInfusionError(undefined, {
      infusion: withTestData as DataInfusion<unknown, unknown[]>,
    });
  });

  describe('name', () => {
    it('is `DataSinkError`', () => {
      expect(error.name).toBe('DataInfusionError');
    });
  });
  describe('message', () => {
    it('has default value', () => {
      expect(error.message).toBe(`Not infused withTestData`);
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

import { describe, expect, it } from '@jest/globals';
import { PromiseResolver } from '@proc7ts/async';
import { Supply } from '@proc7ts/supply';
import { withValue } from '../infusions/with-value.js';
import { orSeep } from './or-seep.js';
import { seep } from './seep.js';

describe('orSeep', () => {
  it('seeps default value first', async () => {
    const inputAvailable = new PromiseResolver<string>();
    const supply = new Supply();
    const sank: string[] = [];

    const promise = seep(orSeep(withValue('default')))(withValue(inputAvailable.whenDone()))(
      value => {
        sank.push(value);
      },
      supply,
    );

    await new Promise(resolve => setImmediate(resolve));
    expect(sank).toEqual(['default']);

    inputAvailable.resolve('test');
    await new Promise(resolve => setImmediate(resolve));
    expect(sank).toEqual(['default', 'test']);

    supply.off();
    await promise;
  });
  it('does not seep default value if original available', async () => {
    const sank: string[] = [];

    const promise = seep(orSeep(withValue('default')))(withValue('test'))(value => {
      sank.push(value);
    });

    await new Promise(resolve => setImmediate(resolve));
    expect(sank).toEqual(['test']);

    await promise;
  });
});

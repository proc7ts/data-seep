import { describe, expect, it } from '@jest/globals';
import { PromiseResolver } from '@proc7ts/async';
import { withValue } from '../infusions/with-value.js';
import { orSeep } from './or-seep.js';
import { seep } from './seep.js';

describe('orSeep', () => {
  it('seeps default value first', async () => {
    const inputAvailable = new PromiseResolver<string>();
    const sank: string[] = [];

    await seep(orSeep(withValue('default')))(withValue(inputAvailable.whenDone()))(value => {
      sank.push(value);
    });

    expect(sank).toEqual(['default']);

    inputAvailable.resolve('test');
    await new Promise(resolve => setImmediate(resolve));

    expect(sank).toEqual(['default', 'test']);
  });
});

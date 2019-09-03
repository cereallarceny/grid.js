import { shortenId } from '../src/_helpers';

const uuid = require('uuid/v4');

describe('Helpers', () => {
  test("has a function that can shorten ID's", () => {
    const myId = uuid();

    expect(shortenId()).toBe('NOT FOUND');
    expect(shortenId(myId)).toBe(myId.split('-')[0]);
    expect(shortenId(myId).length).toBe(8);
  });
});

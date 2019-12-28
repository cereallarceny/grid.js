import { jwtSign, jwtVerify } from '../src/auth';

import { Logger } from 'syft.js';

describe('Auth', () => {
  let logger;

  beforeAll(async () => {
    logger = new Logger('grid.js', true);
  });

  afterAll(async () => {
    logger = null;
  });

  test('should be able create token', async () => {
    expect(jwtSign({ id: 'test123' })).not.toBe(null);
  });

  test('should be able verify token', async () => {
    expect(jwtSign({ id: 'test123' })).not.toBe(
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6InRlc3QxMjMiLCJpYXQiOjE1Nzc1NDg3MTYsImV4cCI6MTU3NzYzNTExNn0.tbAzBH8OFxV9KAw_i0iKj-_xwCnex_9im2BgbbqNu78'
    );
  });
});

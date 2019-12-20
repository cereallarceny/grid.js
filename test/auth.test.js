import { jwtSign, jwtVerify } from '../src/auth';

import { Logger } from 'syft.js';

// const uuid = require('uuid/v4');

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
    expect(
      jwtVerify(
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImYwZjA5OTZhLWIxYTAtNDE0Yy04MDQyLWM0NWVlZDE0MmQ1YiIsImlhdCI6MTU3Njg1MzM3NywiZXhwIjoxNTc2OTM5Nzc3fQ.h04Jm9kYTErysNrkx3B0brLfSfBme96zQlIFdUrwgeo'
      )
    ).not.toBe(null);
  });
});

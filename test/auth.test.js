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
});

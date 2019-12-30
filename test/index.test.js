import Redis from 'redis';
import { MongoMemoryServer } from 'mongodb-memory-server';
import RedisMock from 'redis-mock';
import { Logger } from '@openmined/syft.js';

describe('Grid', () => {
  let mongoServer, mongoUrl, redisOrig, loggerSpy;

  beforeAll(async () => {
    // Spy on all logger calls.
    loggerSpy = jest.spyOn(Logger.prototype, 'log');

    // Replace Redis with its mock.
    redisOrig = Redis.createClient;
    Redis.createClient = RedisMock.createClient;

    mongoServer = new MongoMemoryServer();
    mongoUrl = await mongoServer.getConnectionString();
  });

  afterAll(async () => {
    await mongoServer.stop();
    jest.resetAllMocks();
    Redis.createClient = redisOrig;
  });

  test('should initialize', async done => {
    const oldEnv = { ...process.env };
    process.env.VERBOSE = 1;
    process.env.PORT = '3003';
    process.env.MONGODB_URI = mongoUrl;
    process.env.REDIS_URL = '';
    const httpPort = parseInt(process.env.PORT) + 1;

    const index = require('../src/index.js');

    // Give it some time to initialize.
    await new Promise(done => setTimeout(done, 200));

    expect(loggerSpy.mock.calls).toHaveLength(2);
    expect(loggerSpy.mock.calls[0][0]).toContain(
      `Socket server running on port ${process.env.PORT}`
    );
    expect(loggerSpy.mock.calls[1][0]).toContain(
      `HTTP server running on port ${httpPort}`
    );

    process.env = { ...oldEnv };
    index.wss.close(done);
  });
});

import {
  Logger,
  GET_PLANS,
  SOCKET_PING,
  WEBRTC_JOIN_ROOM
} from 'syft-helpers.js';
import { Server, WebSocket } from 'mock-socket';
import Redis from 'redis-mock';

import runSockets from '../src/socket';
import DBManager from './_db-manager';

class FakeClient {
  constructor(url) {
    this.messages = [];
    this.connection = new WebSocket(url);

    this.connection.onmessage = event => {
      this.messages.push(JSON.parse(event.data));
    };
  }

  // Send message and return the next server response as a promise.
  async sendReceive(message) {
    let resolver, rejector;

    // Wrap functions in a promise.
    const promise = new Promise((resolve, reject) => {
      resolver = resolve;
      rejector = reject;
    });

    // Reject promise if there's no response in 1s after sending message.
    const timeoutHandler = setTimeout(
      () => rejector(new Error('No response encountered')),
      1000
    );

    const onMessage = event => {
      this.connection.removeEventListener('message', onMessage);
      clearTimeout(timeoutHandler);
      resolver(JSON.parse(event.data));
    };
    this.connection.addEventListener('message', onMessage);

    this.connection.send(JSON.stringify(message));
    return promise;
  }
}

describe('Socket', () => {
  const port = 3001;
  const url = `ws://localhost:${port}`;

  let db, manager, logger, pub, sub;

  beforeAll(async () => {
    manager = new DBManager();

    await manager.start();
    db = manager.db;

    logger = new Logger('grid.js', true);

    pub = Redis.createClient();
    sub = Redis.createClient();
  });

  afterAll(async () => {
    await manager.stop();

    db = null;

    manager = null;
    logger = null;

    pub = null;
    sub = null;
  });

  beforeEach(async () => {
    await db.collection('protocols').insertMany([
      {
        id: 'multiple-millionaire-problem',
        plans: [['a1', 'a2', 'a3'], ['b1', 'b2', 'b3'], ['c1', 'c2', 'c3']]
      },
      {
        id: 'millionaire-problem',
        plans: [['a1', 'a2', 'a3'], ['b1', 'b2', 'b3']]
      }
    ]);
  });

  afterEach(async () => {
    await manager.cleanup();
  });

  test('should get plans for a user with only a protocolId', async () => {
    const wss = new Server(url);
    const client = new FakeClient(url);

    runSockets(db, wss, pub, sub, logger, port);

    const message = await client.sendReceive({
      type: GET_PLANS,
      data: { protocolId: 'millionaire-problem' }
    });

    expect(client.messages.length).toBe(1);

    const { type, data } = message;

    expect(type).toBe(GET_PLANS);
    expect(data.user.instanceId).not.toBe(null);
    expect(data.user.scopeId).not.toBe(null);
    expect(data.user.protocolId).toBe('millionaire-problem');
    expect(data.user.role).toBe('creator');
    expect(data.user.plan).toBe(0);
    expect(data.plans.length).toBe(3);
    expect(data.participants.length).toBe(1);

    await wss.stop();
  });

  test('should get plans for a user with all their information', async () => {
    const wss = new Server(url);
    const client = new FakeClient(url);

    runSockets(db, wss, pub, sub, logger, port);

    await client.sendReceive({
      type: GET_PLANS,
      data: { protocolId: 'millionaire-problem' }
    });

    const message2 = await client.sendReceive({
      type: GET_PLANS,
      data: {
        protocolId: 'millionaire-problem',
        instanceId: client.messages[0].data.participants[0],
        scopeId: client.messages[0].data.user.scopeId
      }
    });

    expect(client.messages.length).toBe(2);

    const { type, data } = message2;

    expect(type).toBe(GET_PLANS);
    expect(data.user.instanceId).toBe(
      client.messages[0].data.participants[0]
    );
    expect(data.user.scopeId).toBe(client.messages[0].data.user.scopeId);
    expect(data.user.protocolId).toBe('millionaire-problem');
    expect(data.user.role).toBe('participant');
    expect(data.user.plan).toBe(1);
    expect(data.plans.length).toBe(3);
    expect(data.participants.length).toBe(1);
    expect(data.participants[0]).toBe(
      client.messages[0].data.user.instanceId
    );

    await wss.stop();
  });

  test('should not send response for ping message', async () => {
    const wss = new Server(url);
    const client = new FakeClient(url);

    runSockets(db, wss, pub, sub, logger, port);

    await expect(client.sendReceive({
      type: SOCKET_PING, data: {}
    })).rejects.toThrow('No response encountered');

    await wss.stop();
  });

  test('should not send response for invalid protocolId', async () => {
    const wss = new Server(url);
    const client = new FakeClient(url);

    runSockets(db, wss, pub, sub, logger, port);

    await expect(client.sendReceive({
      type: GET_PLANS, data: { protocolId: 'totally invalid id' }
    })).rejects.toThrow('No response encountered');

    await wss.stop();
  });

});

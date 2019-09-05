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

  sendMessage(message) {
    this.connection.send(JSON.stringify(message));
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

    sockets = null;
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

  test('should get plans for a user with only a protocolId', async done => {
    const wss = new Server(url);
    const client = new FakeClient(url);

    runSockets(db, wss, pub, sub, logger, port);

    await client.sendMessage({
      type: GET_PLANS,
      data: { protocolId: 'millionaire-problem' }
    });

    await setTimeout(() => {
      expect(client.messages.length).toBe(1);

      const { type, data } = client.messages[0];

      expect(type).toBe(GET_PLANS);
      expect(data.user.instanceId).not.toBe(null);
      expect(data.user.scopeId).not.toBe(null);
      expect(data.user.protocolId).toBe('millionaire-problem');
      expect(data.user.role).toBe('creator');
      expect(data.user.plan).toBe(0);
      expect(data.plans.length).toBe(3);
      expect(data.participants.length).toBe(1);

      wss.stop(done);
    }, 100);
  });

  test('should get plans for a user with all their information', async done => {
    const wss = new Server(url);
    const client = new FakeClient(url);

    runSockets(db, wss, pub, sub, logger, port);

    await client.sendMessage({
      type: GET_PLANS,
      data: { protocolId: 'millionaire-problem' }
    });

    await setTimeout(async () => {
      await client.sendMessage({
        type: GET_PLANS,
        data: {
          protocolId: 'millionaire-problem',
          instanceId: client.messages[0].data.participants[0],
          scopeId: client.messages[0].data.user.scopeId
        }
      });

      await setTimeout(() => {
        expect(client.messages.length).toBe(2);

        const { type, data } = client.messages[1];

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

        wss.stop(done);
      }, 100);
    }, 100);
  });
});

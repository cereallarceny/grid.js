import { Logger, GET_PLANS } from 'syft-helpers.js';
import { Server, WebSocket } from 'mock-socket';
import Redis from 'redis-mock';

import runSockets from '../src/socket';
import DBManager from './_db-manager';

class FakeClient {
  constructor(url) {
    this.messages = [];
    this.connection = new WebSocket(url);

    this.connection.onmessage = event => {
      this.messages.push(event.data);
    };
  }

  sendMessage(message) {
    this.connection.send(JSON.stringify(message));
  }
}

describe('Socket', () => {
  const port = 3001;
  const url = `ws://localhost:${port}`;

  let db, wss, client, manager, logger, pub, sub, sockets;

  beforeAll(async () => {
    manager = new DBManager();

    await manager.start();
    db = manager.db;

    wss = new Server(url);
    client = new FakeClient(url);
    logger = new Logger('grid.js', true);

    pub = Redis.createClient();
    sub = Redis.createClient();

    sockets = runSockets(db, wss, pub, sub, logger, port);
  });

  afterAll(async () => {
    await manager.stop();

    db = null;

    wss = null;
    client = null;
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

  test('should initialize', () => {
    client.connection.onopen = () => {
      client.sendMessage({
        type: GET_PLANS,
        data: { protocolId: 'millionaire-problem' }
      });

      setTimeout(() => {
        console.log(client);
        console.log(client.messages);
      }, 100);
    };
  });
});

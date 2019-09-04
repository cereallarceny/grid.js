import { Logger, GET_PLANS } from 'syft-helpers.js';
import { Server, WebSocket } from 'mock-socket';
import Redis from 'redis-mock';
import { MongoClient } from 'mongodb';
import { MongoMemoryServer } from 'mongodb-memory-server';

import { mongoOptions } from '../src';
import runSockets from '../src/socket';

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
  const logger = new Logger('grid.js', true);
  const wss = new Server(url);
  const client = new FakeClient(url);

  let mongoServer, connection, db, pub, sub, sockets;

  beforeAll(async () => {
    mongoServer = new MongoMemoryServer();

    const mongoUrl = await mongoServer.getConnectionString();
    const mongoDatabase = await mongoServer.getDbName();

    connection = await MongoClient.connect(mongoUrl, mongoOptions);
    db = connection.db(mongoDatabase);

    db.collection('protocols').insertOne({
      id: 'multiple-millionaire-problem',
      plans: [['a1', 'a2', 'a3'], ['b1', 'b2', 'b3'], ['c1', 'c2', 'c3']]
    });

    db.collection('protocols').insertOne({
      id: 'millionaire-problem',
      plans: [['a1', 'a2', 'a3'], ['b1', 'b2', 'b3']]
    });

    pub = Redis.createClient();
    sub = Redis.createClient();

    sockets = runSockets(db, wss, pub, sub, logger, port);
  });

  afterAll(async () => {
    await db.dropDatabase();

    if (connection) connection.close();
    if (mongoServer) await mongoServer.stop();

    db = null;

    pub = null;
    sub = null;

    sockets = null;
  });

  test('should initialize', () => {
    client.connection.onopen = () => {
      client.sendMessage({
        type: GET_PLANS,
        data: { protocolId: 'millionaire-problem' }
      });

      console.log(client);
      console.log(client.messages);
    };
  });
});

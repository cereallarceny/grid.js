import {
  GET_PROTOCOL,
  Logger,
  SOCKET_PING,
  WEBRTC_INTERNAL_MESSAGE,
  WEBRTC_JOIN_ROOM,
  WEBRTC_PEER_LEFT
} from 'syft.js';
import { Server, WebSocket } from 'mock-socket';
import { examplePlans, exampleProtocols } from '../seed/samples';

import DBManager from './_db-manager';
import Redis from 'redis-mock';
import runSockets from '../src/socket';

const NO_RESPONSE = 'no-response';

// Wrapper for mock-socket to bring it closer to `ws` module behavior.
class MockServer {
  constructor(wss) {
    this.wss = wss;

    // `ws` module has `clients` property with array of server-side sockets.
    this.clients = [];

    this.wss.on('connection', ws => {
      this.clients.push(ws);

      ws.on('close', () => {
        this.clients = this.clients.filter(client => client !== ws);
      });
    });

    // For some reason, closing client websocket triggers `wss` close event,
    // but not `ws` close event.
    // We need to re-emit close event under different name to fix that.
    this.wss.on('close', () => {
      this.clients.forEach(socket => {
        // Find closed client sockets and emit different event to
        // trigger `ws.on('close')`.
        if (socket.readyState === WebSocket.CLOSED) {
          socket.dispatchEvent(new Event('server::close'));
        }
      });
    });
  }

  on() {
    return this.wss.on.apply(this.wss, arguments);
  }

  stop() {
    return this.wss.stop.apply(this.wss, arguments);
  }
}

class FakeClient {
  constructor(url) {
    this.messages = [];
    this.connection = new WebSocket(url);

    this.connection.onmessage = event => {
      this.messages.push(JSON.parse(event.data));
    };
  }

  // Send message and return the next server response as a promise.
  async send(message, returnResponsePromise = true, responseTimeout = 200) {
    this.connection.send(JSON.stringify(message));
    if (returnResponsePromise) {
      return this.receive(responseTimeout, message);
    } else {
      return Promise.resolve();
    }
  }

  // Return promise of next server response.
  async receive(timeout = 200, message = null) {
    let resolver, rejector;

    // Wrap functions in a promise.
    const promise = new Promise((resolve, reject) => {
      resolver = resolve;
      rejector = reject;
    });

    // Reject promise if there's no response in 1s after sending message.
    const timeoutHandler = setTimeout(() => {
      this.connection.removeEventListener('message', onMessage);
      const messageText = JSON.stringify(message, null, 2);
      rejector(new Error(`${NO_RESPONSE}\n${messageText}`));
    }, timeout);

    const onMessage = event => {
      this.connection.removeEventListener('message', onMessage);

      clearTimeout(timeoutHandler);

      resolver(JSON.parse(event.data));
    };

    this.connection.addEventListener('message', onMessage);

    return promise;
  }

  close() {
    this.connection.close();
  }
}

describe('Socket', () => {
  const port = 3000;
  const url = `ws://localhost:${port}`;

  let wss, db, manager, logger, pub, sub;

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
    await db.collection('protocols').insertMany(exampleProtocols);
    await db.collection('plans').insertMany(examplePlans);

    wss = new MockServer(new Server(url));
  });

  afterEach(async () => {
    await manager.cleanup();

    wss.stop();
  });

  test('should get plans for a worker with only a protocolId', async () => {
    const client = new FakeClient(url);

    runSockets(db, wss, pub, sub, logger, port);

    const message = await client.send({
      type: GET_PROTOCOL,
      data: { protocolId: exampleProtocols[1].id }
    });

    expect(client.messages.length).toBe(1);

    const { type, data } = message;

    expect(type).toBe(GET_PROTOCOL);
    expect(data.worker.workerId).not.toBe(null);
    expect(data.worker.scopeId).not.toBe(null);
    expect(data.worker.protocolId).toBe(exampleProtocols[1].id);
    expect(data.worker.role).toBe('creator');
    expect(data.plan).toBe(examplePlans[3].contents);
    expect(data.protocol).toBe(exampleProtocols[1].contents);
    expect(Object.keys(data.participants).length).toBe(1);
    expect(Object.values(data.participants)).toStrictEqual(['worker2']);
  });

  test('should get plans for a worker with all their information', async () => {
    const client = new FakeClient(url);

    runSockets(db, wss, pub, sub, logger, port);

    await client.send({
      type: GET_PROTOCOL,
      data: { protocolId: exampleProtocols[0].id }
    });

    const message2 = await client.send({
      type: GET_PROTOCOL,
      data: {
        protocolId: exampleProtocols[0].id,
        workerId: Object.keys(client.messages[0].data.participants)[0],
        scopeId: client.messages[0].data.worker.scopeId
      }
    });
    expect(client.messages.length).toBe(2);

    const { type, data } = message2;

    expect(type).toBe(GET_PROTOCOL);
    expect(data.worker.workerId).toBe(
      Object.keys(client.messages[0].data.participants)[0]
    );
    expect(data.worker.scopeId).toBe(client.messages[0].data.worker.scopeId);
    expect(data.worker.protocolId).toBe(exampleProtocols[0].id);
    expect(data.worker.role).toBe('participant');
    expect(data.worker.plan).toBe(1);
    expect(data.plan).toBe(examplePlans[1].contents);
    expect(data.protocol).toBe(exampleProtocols[0].contents);
    expect(Object.keys(data.participants).length).toBe(2);
    expect(Object.values(data.participants)).toStrictEqual([
      'worker1',
      'worker3'
    ]);
  });

  test('should not send response for ping message', async () => {
    const client = new FakeClient(url);

    runSockets(db, wss, pub, sub, logger, port);

    await expect(
      client.send({
        type: SOCKET_PING,
        data: {}
      })
    ).rejects.toThrow(NO_RESPONSE);
  });

  test('should not send response for invalid protocolId', async () => {
    const client = new FakeClient(url);

    runSockets(db, wss, pub, sub, logger, port);

    await expect(
      client.send({
        type: GET_PROTOCOL,
        data: { protocolId: 'totally-invalid-id' }
      })
    ).rejects.toThrow(NO_RESPONSE);
  });

  test('should send peer join event to all clients in the scope', async () => {
    const client1 = new FakeClient(url),
      client2 = new FakeClient(url),
      client3 = new FakeClient(url);

    runSockets(db, wss, pub, sub, logger, port);

    const creatorResponse = await client1.send({
      type: GET_PROTOCOL,
      data: {
        protocolId: exampleProtocols[0].id
      }
    });

    const scopeId = creatorResponse.data.worker.scopeId,
      client1Id = creatorResponse.data.worker.workerId,
      client2Id = Object.keys(creatorResponse.data.participants)[0];

    await client2.send({
      type: GET_PROTOCOL,
      data: {
        protocolId: exampleProtocols[0].id,
        workerId: client2Id,
        scopeId
      }
    });

    // Join message should not have response (join event is not sent to issuer).
    await expect(
      client1.send({
        type: WEBRTC_JOIN_ROOM,
        data: {
          workerId: client1Id,
          scopeId
        }
      })
    ).rejects.toThrow(NO_RESPONSE);

    expect(client1.messages).toHaveLength(1);
    expect(client2.messages).toHaveLength(2);
    // Client #3 didn't make get plan request hence shouldn't receive events.
    expect(client3.messages).toHaveLength(0);

    expect(client2.messages[1].type).toBe(WEBRTC_JOIN_ROOM);
    expect(client2.messages[1].data.workerId).toBe(client1Id);
    expect(client2.messages[1].data.scopeId).toBe(scopeId);
  });

  test('should send peer left event when connection closes', async () => {
    const client1 = new FakeClient(url),
      client2 = new FakeClient(url);

    runSockets(db, wss, pub, sub, logger, port);

    const creatorResponse = await client1.send({
      type: GET_PROTOCOL,
      data: {
        protocolId: exampleProtocols[0].id
      }
    });

    await client2.send({
      type: GET_PROTOCOL,
      data: {
        protocolId: exampleProtocols[0].id,
        scopeId: creatorResponse.data.worker.scopeId,
        workerId: Object.keys(creatorResponse.data.participants)[0]
      }
    });

    client1.close();

    const messageToClient2 = await client2.receive();

    expect(messageToClient2.type).toBe(WEBRTC_PEER_LEFT);
    expect(messageToClient2.data.workerId).toBe(
      creatorResponse.data.worker.workerId
    );
  });

  test('should send internal message between clients', async () => {
    const client1 = new FakeClient(url),
      client2 = new FakeClient(url),
      client3 = new FakeClient(url);

    runSockets(db, wss, pub, sub, logger, port);

    const creatorResponse = await client1.send({
      type: GET_PROTOCOL,
      data: {
        protocolId: exampleProtocols[0].id
      }
    });

    await client2.send({
      type: GET_PROTOCOL,
      data: {
        protocolId: exampleProtocols[0].id,
        scopeId: creatorResponse.data.worker.scopeId,
        workerId: Object.keys(creatorResponse.data.participants)[0]
      }
    });

    await client3.send({
      type: GET_PROTOCOL,
      data: {
        protocolId: exampleProtocols[0].id,
        scopeId: creatorResponse.data.worker.scopeId,
        workerId: Object.keys(creatorResponse.data.participants)[1]
      }
    });

    const internalPayload = {
      data: { somekey: 'somedata' },
      scopeId: creatorResponse.data.worker.scopeId,
      // From client3 to client2.
      workerId: Object.keys(creatorResponse.data.participants)[1],
      to: Object.keys(creatorResponse.data.participants)[0],
      type: 'offer'
    };

    await client3.send(
      {
        type: WEBRTC_INTERNAL_MESSAGE,
        data: internalPayload
      },
      false
    );

    const client2Message = await client2.receive();

    expect(client2Message.type).toBe(WEBRTC_INTERNAL_MESSAGE);
    expect(client2Message.data).toStrictEqual(internalPayload);
    expect(client1.messages).toHaveLength(1);
    expect(client2.messages).toHaveLength(2);
    expect(client3.messages).toHaveLength(1);
  });

  test('should not send unknown message type to clients', async () => {
    const client1 = new FakeClient(url),
      client2 = new FakeClient(url);

    runSockets(db, wss, pub, sub, logger, port);

    const creatorResponse = await client1.send({
      type: GET_PROTOCOL,
      data: {
        protocolId: exampleProtocols[0].id
      }
    });

    await client2.send({
      type: GET_PROTOCOL,
      data: {
        protocolId: exampleProtocols[0].id,
        scopeId: creatorResponse.data.worker.scopeId,
        workerId: Object.keys(creatorResponse.data.participants)[0]
      }
    });

    const unknownMessage = {
      type: 'weird-type',
      data: {
        scopeId: creatorResponse.data.worker.scopeId,
        workerId: Object.keys(creatorResponse.data.participants)[0]
      }
    };

    await expect(client1.send(unknownMessage)).rejects.toThrow(NO_RESPONSE);

    expect(client1.messages).toHaveLength(1);
    expect(client2.messages).toHaveLength(1);

    // Pretend unknown message type was subscribed and sent.
    sub.subscribe(unknownMessage.type);
    pub.publish(unknownMessage.type, JSON.stringify(unknownMessage.data));

    await new Promise(done => setTimeout(done, 100));

    expect(client1.messages).toHaveLength(1);
    expect(client2.messages).toHaveLength(1);
  });

  test('should handle event when no clients connected', async () => {
    runSockets(db, wss, pub, sub, logger, port);

    pub.publish(WEBRTC_PEER_LEFT, JSON.stringify({ test: 1 }));
    await new Promise(done => setTimeout(done, 100));

    // Check that wss is still operable.
    const client1 = new FakeClient(url);
    const creatorResponse = await client1.send({
      type: GET_PROTOCOL,
      data: {
        protocolId: exampleProtocols[0].id
      }
    });

    pub.publish(
      WEBRTC_PEER_LEFT,
      JSON.stringify({
        scopeId: creatorResponse.data.worker.scopeId,
        workerId: 'dummy'
      })
    );

    const peerLeftMessage = await client1.receive();
    expect(peerLeftMessage.data.workerId).toBe('dummy');
  });
});

import WebSocket from 'ws';
import Redis from 'redis';

import initDB from './init-db';
import { getPlans } from './messages';
import runWebRTC from './webrtc';

const uuid = require('uuid/v4');

const port = process.env.PORT || 3000;
const wss = new WebSocket.Server({ port });

const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
const pub = Redis.createClient(redisUrl);
const sub = Redis.createClient(redisUrl);

sub.subscribe('syft-message');

// Our main socket server function - all async, all day
const startSocketServer = async () => {
  console.log(`Server running on ${port} port, PID: ${process.pid}`);

  const db = await initDB();
  const rooms = {};
  const clients = {};

  const send = (type, data, socket) =>
    socket.send(JSON.stringify({ type, data }));

  sub.on('message', async (t, d) => {
    const { connectionId, message } = JSON.parse(d);
    const ws = clients[connectionId];

    if (t === 'syft-message') {
      const { type, data } = JSON.parse(message);

      if (!clients[connectionId].instanceId && data.instanceId) {
        ws.instanceId = data.instanceId;
        clients[connectionId] = ws;
      }

      if (!clients[connectionId].scopeId && data.scopeId) {
        ws.scopeId = data.scopeId;
        clients[connectionId] = ws;
      }

      if (type.includes('webrtc:')) {
        runWebRTC(type, data, send, rooms, ws);
      } else if (type === 'get-plans') {
        const returnedData = await getPlans(db, data);

        send('get-plans', { ...returnedData }, ws);
      }
    }
  });

  wss.on('connection', ws => {
    const connectionId = uuid();
    clients[connectionId] = ws;

    ws.on('close', () => {
      // If at some point we assigned this socket connection an instanceId and scopeId and "rooms" knows about it, remove them from the rooms
      if (
        ws.instanceId &&
        ws.scopeId &&
        rooms.hasOwnProperty(ws.scopeId) &&
        rooms[ws.scopeId].hasOwnProperty(ws.instanceId)
      ) {
        delete rooms[ws.scopeId][ws.instanceId];

        runWebRTC(
          'webrtc: peer-left',
          { instanceId: ws.instanceId, scopeId: ws.scopeId },
          send,
          rooms,
          ws
        );

        // If the room is empty, delete it
        if (Object.keys(rooms[ws.scopeId]).length === 0) {
          delete rooms[ws.scopeId];
        }
      }

      delete clients[connectionId];
    });

    ws.on('message', message => {
      pub.publish('syft-message', JSON.stringify({ connectionId, message }));
    });
  });
};

// Kick things off
startSocketServer();

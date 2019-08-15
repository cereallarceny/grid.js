/*
TODO:
- https://blog.jscrambler.com/scaling-node-js-socket-server-with-nginx-and-redis/
*/

import WebSocket from 'ws';

import initDB from './init-db';
import { getProtocol, getPlans, createScope } from './messages';
import runWebRTC from './webrtc';

const port = process.env.PORT || 3000;
const wss = new WebSocket.Server({ port });

// Our main socket server function - all async, all day
const startSocketServer = async () => {
  const db = await initDB();
  const rooms = {};

  wss.on('connection', ws => {
    console.log('Syft connected');

    ws.on('close', () => {
      console.log('Syft disconnected');
    });

    ws.on('message', async message => {
      const { type, data } = JSON.parse(message);
      const send = (type, data, socket = ws) =>
        socket.send(JSON.stringify({ type, data }));

      console.log(type, data);

      if (type.includes('webrtc:')) {
        runWebRTC(type, data, send, rooms, ws);
      } else if (type === 'get-protocol') {
        const protocol = await getProtocol(db, data);

        send('get-protocol', {
          instanceId: data.instanceId,
          protocol
        });
      } else if (type === 'get-plans') {
        const plans = await getPlans(db, data);

        send('get-plans', {
          ...data,
          plans
        });
      } else if (type === 'create-scope') {
        const { scopeId, creatorPlan } = await createScope(db, data);

        send('create-scope', {
          ...data,
          scopeId,
          plan: creatorPlan
        });
      }
    });
  });
};

// Kick things off
startSocketServer();

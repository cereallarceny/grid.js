import WebSocket from 'ws';

import initDB from './init-db';
import { getPlans } from './messages';
import runWebRTC from './webrtc';

const port = process.env.PORT || 3000;
const wss = new WebSocket.Server({ port });

// Our main socket server function - all async, all day
const startSocketServer = async () => {
  console.log(`Server running on ${port} port, PID: ${process.pid}`);

  const db = await initDB();
  const rooms = {};

  wss.on('connection', ws => {
    console.log('Syft connected');

    const send = (type, data, socket = ws) =>
      socket.send(JSON.stringify({ type, data }));

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
      }

      console.log('Syft disconnected');
    });

    ws.on('message', async message => {
      const { type, data } = JSON.parse(message);

      if (!ws.instanceId && data.instanceId) {
        ws.instanceId = data.instanceId;
      }

      if (!ws.scopeId && data.scopeId) {
        ws.scopeId = data.scopeId;
      }

      if (type.includes('webrtc:')) {
        runWebRTC(type, data, send, rooms, ws);
      } else if (type === 'get-plans') {
        const returnedData = await getPlans(db, data);

        send('get-plans', { ...returnedData });
      }
    });
  });
};

// Kick things off
startSocketServer();

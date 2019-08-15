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

      if (type.includes('webrtc:')) {
        if (type === 'webrtc: join-room') {
          // If the room doesn't exist yet, create it
          if (!rooms.hasOwnProperty(data.scopeId)) {
            rooms[data.scopeId] = {};
          }

          // Have the current client join the room
          rooms[data.scopeId][data.instanceId] = ws;

          // Let everyone else in the room know about the new client
          Object.keys(rooms[data.scopeId]).forEach(client => {
            send(
              'webrtc: new-peer',
              { instanceId: data.instanceId },
              rooms[data.scopeId][client]
            );
          });
        } else if (type === 'webrtc: internal-message') {
          if (
            data.to !== undefined &&
            rooms[data.scopeId][data.to] !== undefined
          ) {
            // If the message indicates the recipient and this recipient is known to the server, we send the message only to him...
            send(
              'webrtc: internal-message',
              data,
              rooms[data.scopeId][data.to]
            );
          } else {
            // ... otherwise we consider the message to be broadcast
            Object.keys(rooms[data.scopeId]).forEach(client => {
              if (client !== data.instanceId) {
                send(
                  'webrtc: internal-message',
                  data,
                  rooms[data.scopeId][client]
                );
              }
            });
          }
        } else if (type === 'webrtc: peer-disconnected') {
          // TODO
          // When disconnecting a client, we inform the rest about it
          // socket.broadcast.to(socket.room).emit('leave', socket.user_id);
          // delete users[socket.user_id];
        }
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

import WebSocket from 'ws';
import Redis from 'redis';
import { MongoClient as mongo } from 'mongodb';

import { getPlans } from './plans';
import {
  WEBRTC_JOIN_ROOM,
  WEBRTC_NEW_PEER,
  WEBRTC_INTERNAL_MESSAGE,
  WEBRTC_PEER_LEFT,
  GET_PLANS,
  SOCKET_PING
} from 'syft-helpers.js';

const uuid = require('uuid/v4');

const DEFAULT_REDIS_URL = 'redis://127.0.0.1:6379';
const DEFAULT_MONGO_URL = 'mongodb://localhost:27017';

// Define the socket port and create the Websocket server
const port = process.env.PORT || 3000;
const wss = new WebSocket.Server({ port });

// Define the Redis port and create the pub/sub clients
const redisUrl = process.env.REDIS_URL || DEFAULT_REDIS_URL;
const pub = Redis.createClient(redisUrl);
const sub = Redis.createClient(redisUrl);

// Define the MongoDB connection url
const mongoUrl = process.env.MONGODB_URI || DEFAULT_MONGO_URL;

// Initialize database
mongo.connect(mongoUrl, (err, client) => {
  if (err) {
    console.error('Cannot connect to MongoDB', err);

    return;
  }

  // If we have a successful connection
  if (client) {
    // Select the DB we connected to if we have one, otherwise, use 'grid'
    const db = client.db(
      mongoUrl === DEFAULT_MONGO_URL
        ? 'grid'
        : mongoUrl.substring(mongoUrl.lastIndexOf('/') + 1)
    );

    // Start the server officially and send in the grid database
    start(db);
  }
});

const start = db => {
  console.log(`Server running on ${port} port, PID: ${process.pid}`);

  const clients = {};
  const rooms = {};

  sub.subscribe(WEBRTC_PEER_LEFT);
  sub.subscribe(WEBRTC_JOIN_ROOM);
  sub.subscribe(WEBRTC_INTERNAL_MESSAGE);

  const send = (type, data, socket) =>
    socket.send(JSON.stringify({ type, data }));

  wss.on('connection', ws => {
    ws.on('message', async message => {
      const { type, data } = JSON.parse(message);

      if (type === GET_PLANS) {
        if (!data.instanceId) {
          data.instanceId = uuid();
        }

        const getPlanData = await getPlans(db, data);
        const scopeId = getPlanData.user.scopeId;

        ws.scopeId = scopeId;
        ws.instanceId = data.instanceId;
        clients[data.instanceId] = ws;

        if (!rooms[scopeId]) {
          rooms[scopeId] = [];
        }

        rooms[scopeId].push(data.instanceId);

        console.log('GET PLANS', Object.keys(clients), rooms);

        send(GET_PLANS, { ...getPlanData }, ws);
      } else if (type !== SOCKET_PING) {
        pub.publish(type, JSON.stringify({ caller: ws.instanceId, data }));
      }
    });

    ws.on('close', () => {
      const data = {
        instanceId: ws.instanceId,
        scopeId: ws.scopeId
      };

      pub.publish(
        WEBRTC_PEER_LEFT,
        JSON.stringify({ caller: ws.instanceId, data })
      );
    });
  });

  sub.on('message', async (type, d) => {
    const { caller, data } = JSON.parse(d);
    const participants = rooms[data.scopeId];

    if (!participants || participants.length === 0) return;

    // TODO: You REALLY might wanna double check that this logic is working and makes sense
    if (type === WEBRTC_PEER_LEFT) {
      const pIndex = participants.findIndex(i => i === data.instanceId);

      if (pIndex !== -1) {
        console.log('LEAVING BEFORE', participants, data, Object.keys(clients));

        participants.forEach(iId => {
          if (iId !== caller && clients[iId]) {
            send(WEBRTC_PEER_LEFT, data, clients[iId]);
          }
        });

        participants.splice(pIndex, 1);

        if (participants.length === 0) {
          delete rooms[data.scopeId];
        }

        console.log('LEAVING AFTER', participants, data, Object.keys(clients));
      }

      delete clients[data.instanceId];
    } else if (type === WEBRTC_JOIN_ROOM) {
      console.log('JOINING', participants);

      participants.forEach(iId => {
        if (iId !== caller && clients[iId]) {
          send(WEBRTC_NEW_PEER, { instanceId: data.instanceId }, clients[iId]);
        }
      });
    }

    // TODO: There's some sort of issue here when connecting a third peer
    // Connecting and disconnecting two peers works perfectly, but for some reason adding a third errors in the browser
    else if (type === WEBRTC_INTERNAL_MESSAGE) {
      participants.forEach(iId => {
        if (iId !== caller && clients[iId]) {
          send(WEBRTC_INTERNAL_MESSAGE, data, clients[iId]);
        }
      });
    }
  });
};

// Let's go!
// const start = db => {
//   console.log(`Server running on ${port} port, PID: ${process.pid}`);

//   // Have somewhere to store the list of clients connected to the server
//   // As well as the list of WebRTC rooms that each client is potentially connected to
//   const clients = {};
//   const rooms = {};

//   // Subscribe to all messages we could possibly receive from the client
//   sub.subscribe(WEBRTC_JOIN_ROOM);
//   sub.subscribe(WEBRTC_INTERNAL_MESSAGE);
//   sub.subscribe(GET_PLANS);

//   // A helper function for sending information back to the client
//   const send = (type, data, socket) =>
//     socket.send(JSON.stringify({ type, data }));

//   // When we have a new Websocket connection with a client
//   wss.on('connection', ws => {
//     // Generate a random ID for the client connection
//     const connectionId = uuid();

//     // Add that client to the list of clients
//     clients[connectionId] = ws;

//     // Any time we receive a message from the client
//     ws.on('message', message => {
//       // Parse the type and data from the message
//       const { type, data } = JSON.parse(message);

//       // Publish the message to Redis (handled by sub.on('message') below)
//       // The message we're passing needs to be a string for Redis to work with it... so we must re-stringify
//       // We're not able to properly stringify the ws object, so instead we pass the connectionId and perform a lookup
//       if (type !== SOCKET_PING) {
//         pub.publish(type, JSON.stringify({ connectionId, data }));
//       }
//     });

//     // Any time a client disconnects
//     ws.on('close', () => {
//       // If this client was ever part of any WebRTC rooms
//       if (
//         ws.instanceId &&
//         ws.scopeId &&
//         rooms.hasOwnProperty(ws.scopeId) &&
//         rooms[ws.scopeId].hasOwnProperty(ws.instanceId)
//       ) {
//         // Remove that peer from the rooms object
//         delete rooms[ws.scopeId][ws.instanceId];

//         // If the room is empty, delete it
//         if (Object.keys(rooms[ws.scopeId]).length === 0) {
//           delete rooms[ws.scopeId];
//         }

//         // Assuming there's users still in that room, we need to inform them that this client has left
//         else {
//           Object.keys(rooms[ws.scopeId]).forEach(client => {
//             const clientData = {
//               instanceId: ws.instanceId,
//               scopeId: ws.scopeId
//             };

//             send(WEBRTC_PEER_LEFT, clientData, rooms[ws.scopeId][client]);
//           });
//         }
//       }

//       // Delete the record of that client
//       delete clients[connectionId];
//     });
//   });

//   // When Redis receives a message (from pub.publish() above)
//   sub.on('message', async (type, d) => {
//     // Parse the connectionId and data being passed
//     const { connectionId, data } = JSON.parse(d);

//     // Based on this connectionId, retrieve the correct Websocket connection
//     const ws = clients[connectionId];

//     // If this client doesn't yet have an instanceId associated with the Websocket connection - add it
//     if (!clients[connectionId].instanceId && data.instanceId) {
//       ws.instanceId = data.instanceId;
//       clients[connectionId] = ws;
//     }

//     // If this client doesn't yet have a scopeId associated with the Websocket connection - add it
//     if (!clients[connectionId].scopeId && data.scopeId) {
//       ws.scopeId = data.scopeId;
//       clients[connectionId] = ws;
//     }

//     // If someone joined the WebRTC room
//     if (type === WEBRTC_JOIN_ROOM) {
//       // If the room doesn't exist yet, create it
//       if (!rooms.hasOwnProperty(data.scopeId)) {
//         rooms[data.scopeId] = {};
//       }

//       // Have the current client join the room
//       rooms[data.scopeId][data.instanceId] = ws;

//       // Let everyone else in the room know about the new client
//       Object.keys(rooms[data.scopeId]).forEach(client => {
//         const clientData = { instanceId: data.instanceId };

//         send(WEBRTC_NEW_PEER, clientData, rooms[data.scopeId][client]);
//       });
//     }

//     // If someone is sending an SDP message or ICE candidate
//     else if (type === WEBRTC_INTERNAL_MESSAGE) {
//       // Only send a message to someone specific
//       if (data.to !== undefined && rooms[data.scopeId][data.to] !== undefined) {
//         send(WEBRTC_INTERNAL_MESSAGE, data, rooms[data.scopeId][data.to]);
//       }

//       // Or, broadcast the message to everyone in the room
//       else {
//         Object.keys(rooms[data.scopeId]).forEach(client => {
//           if (client !== data.instanceId) {
//             send(WEBRTC_INTERNAL_MESSAGE, data, rooms[data.scopeId][client]);
//           }
//         });
//       }
//     }

//     // If someone is trying to get their plans
//     else if (type === GET_PLANS) {
//       const returnedData = await getPlans(db, data);

//       send(GET_PLANS, { ...returnedData }, ws);
//     }
//   });
// };

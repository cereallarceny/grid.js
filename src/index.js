import WebSocket from 'ws';
import Redis from 'redis';
import { MongoClient as mongo } from 'mongodb';

import { getPlans } from './plans';
import {
  WEBRTC_JOIN_ROOM,
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

// Let's go!
const start = db => {
  console.log(`Server running on ${port} port, PID: ${process.pid}`);

  // A helper function for sending information back to the client
  const send = (type, data, socket) =>
    socket.send(JSON.stringify({ type, data }));

  // A helper function for sending information to all clients in a room ("scopeId")
  const sendToRoom = (type, data, includeMe = false) => {
    const { instanceId, scopeId } = data;

    // Give me all the participants in the room, optionally including myself
    const participants = [...wss.clients].filter(client => {
      if (includeMe) {
        return client.scopeId === scopeId;
      }

      return client.scopeId === scopeId && client.instanceId !== instanceId;
    });

    // For each of them, send the message
    participants.forEach(client => send(type, data, client));
  };

  // A helper function for sending information to a specific client
  const sendToClient = (type, data) => {
    const client = [...wss.clients].filter(c => c.instanceId === data.to)[0];

    if (client) send(type, data, client);
  };

  // When we have a new Websocket connection with a client
  wss.on('connection', ws => {
    // Any time we receive a message from the client
    ws.on('message', async message => {
      const { type, data } = JSON.parse(message);

      // If the user is asking for their plans, they're kicking off their participation
      if (type === GET_PLANS) {
        // If they don't yet have an instanceId, let's give them one
        if (!data.instanceId) {
          data.instanceId = uuid();
        }

        // Get the plan data and the scopeId
        const getPlanData = await getPlans(db, data);

        // On the WebSocket object, save the instanceId and scopeId
        ws.instanceId = data.instanceId;
        ws.scopeId = getPlanData.user.scopeId;

        // Send the user their plans
        send(GET_PLANS, { ...getPlanData }, ws);
      } else if (type !== SOCKET_PING) {
        // If it's any other type of message, publish it to Redis (handled by sub.on('message') below)
        // There's no need to handle the keep-alive message "SOCKET_PING"
        pub.publish(type, JSON.stringify(data));
      }
    });

    // Any time a client disconnects
    ws.on('close', () => {
      const data = {
        instanceId: ws.instanceId,
        scopeId: ws.scopeId
      };

      // Publish the message to Redis to let the other participants know
      pub.publish(WEBRTC_PEER_LEFT, JSON.stringify(data));
    });
  });

  // Subscribe to all messages we could possibly receive from the client
  sub.subscribe(WEBRTC_PEER_LEFT);
  sub.subscribe(WEBRTC_JOIN_ROOM);
  sub.subscribe(WEBRTC_INTERNAL_MESSAGE);

  // Whenever Redis receives a message (from itself or from another server instance)
  sub.on('message', (type, d) => {
    // If this server doesn't have any clients, don't bother
    if (!wss || !wss.clients || wss.clients.length === 0) return;

    // Otherwise, parse the message that was sent to us
    const data = JSON.parse(d);

    if (type === WEBRTC_PEER_LEFT) {
      sendToRoom(type, data);
    } else if (type === WEBRTC_JOIN_ROOM) {
      sendToRoom(type, data);
    } else if (type === WEBRTC_INTERNAL_MESSAGE) {
      sendToClient(type, data);
    }
  });
};

/*
TODO:
- Client-side issue with peer disconnecting
*/

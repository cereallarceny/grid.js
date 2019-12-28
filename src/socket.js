import {
  GET_PROTOCOL,
  SOCKET_PING,
  WEBRTC_INTERNAL_MESSAGE,
  WEBRTC_JOIN_ROOM,
  WEBRTC_PEER_LEFT
} from 'syft.js';

import { getProtocol } from './protocols';
import { shortenId as s } from './_helpers';

const uuid = require('uuid/v4');

export default (db, wss, pub, sub, logger, port) => {
  logger.log(`Socket server running on port ${port}, PID: ${process.pid}`);

  // A helper function for sending information back to the client
  const send = (type, data, socket) =>
    socket.send(JSON.stringify({ type, data }));

  // A helper function for sending information to all clients in a room ("scopeId")
  const sendToRoom = (type, data) => {
    const { workerId, scopeId } = data;

    // Give me all the participants in the room, excluding myself
    const participants = [...wss.clients].filter(
      c => c.scopeId === scopeId && c.workerId !== workerId
    );

    logger.log(
      `Sending message (${type}) from worker ${s(workerId)} to room ${s(
        scopeId
      )} (${participants.length} other participant${
        participants.length !== 1 ? 's' : ''
      })`
    );

    // For each of them, send the message
    participants.forEach(client => send(type, data, client));
  };

  // A helper function for sending information to a specific client
  const sendToClient = (type, data) => {
    const { to, workerId, scopeId } = data;

    // Find the specific client in the specific room we're looking for
    const client = [...wss.clients].filter(
      c => c.scopeId === scopeId && c.workerId === to
    )[0];

    logger.log(
      `Sending message (${type}) from worker ${s(workerId)} to worker ${s(to)}`
    );

    if (client) send(type, data, client);
  };

  // When we have a new Websocket connection with a client
  wss.on('connection', ws => {
    logger.log('New socket connection');

    // Any time we receive a message from the client
    ws.on('message', async message => {
      const { type, data } = JSON.parse(message);

      if (type !== SOCKET_PING) {
        logger.log(`Received message (${type}) on WS`);
      }

      // If the worker is asking for information on a plan, they're kicking off their participation
      if (type === GET_PROTOCOL) {
        // If they don't yet have an workerId, let's give them one
        if (!data.workerId) {
          data.workerId = uuid();
        }

        try {
          // Get the protocol data, plan assignment data, scopeId, and other information
          const protocolData = await getProtocol(db, data, logger);

          // On the WebSocket object, save the workerId and scopeId
          ws.workerId = data.workerId;
          ws.scopeId = protocolData.worker.scopeId;

          logger.log(
            `Sending protocol and plan assignment to ${s(ws.workerId)}`
          );

          // Send the worker their requested data
          send(GET_PROTOCOL, { ...protocolData }, ws);
        } catch (error) {
          logger.log(
            `Could not get protocol for worker ${s(data.workerId)}`,
            error
          );
        }
      } else if (type !== SOCKET_PING) {
        // If it's any other type of message, publish it to Redis (handled by sub.on('message') below)
        // There's no need to handle the keep-alive message "SOCKET_PING"
        pub.publish(type, JSON.stringify(data));
      }
    });

    // Any time a client disconnects
    ws.on('close', () => {
      const data = {
        workerId: ws.workerId,
        scopeId: ws.scopeId
      };

      logger.log(`Closed connection to worker ${s(ws.workerId)}`);

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

    logger.log(`Received message (${type}) on Redis`);

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

import WebSocket from 'ws';

import initDB from './init-db';
import { getProtocol, getPlans, createScope } from './messages';

const port = process.env.PORT || 3000;
const wss = new WebSocket.Server({ port });

// Our main socket server function - all async, all day
const startSocketServer = async () => {
  const db = await initDB();

  wss.on('connection', ws => {
    console.log('Syft connected');

    ws.on('close', () => {
      console.log('Syft disconnected');
    });

    ws.on('message', async message => {
      const { type, data } = JSON.parse(message);
      const send = data => ws.send(JSON.stringify({ type, data }));

      if (type === 'get-protocol') {
        const protocol = await getProtocol(db, data);

        send({
          instanceId: data.instanceId,
          protocol
        });
      } else if (type === 'get-plans') {
        const plans = await getPlans(db, data);

        send({
          ...data,
          plans
        });
      } else if (type === 'create-scope') {
        const { scopeId, creatorPlan } = await createScope(db, data);

        send({
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

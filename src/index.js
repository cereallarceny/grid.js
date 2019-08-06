import WebSocket from 'ws';
import examplePlan from './example-plan';

const uuid = require('uuid/v4');

const port = process.env.PORT || 3000;
const wss = new WebSocket.Server({ port });

const ALL_PROTOCOLS = [
  {
    id: 'millionaire-problem',
    plans: [
      [examplePlan, examplePlan, examplePlan], // user 1
      [examplePlan, examplePlan, examplePlan], // user 2
      [examplePlan, examplePlan, examplePlan] // user 3
    ]
  }
];

wss.on('connection', ws => {
  console.log('Syft connected');

  ws.on('close', () => {
    console.log('Syft disconnected');
  });

  ws.on('message', message => {
    const { type, data } = JSON.parse(message);

    if (type === 'get-protocol') {
      // TODO: Patrick we need to store this somewhere!
      const instanceId = data.instanceId;

      ws.send(
        JSON.stringify({
          type,
          data: {
            instanceId,
            protocol:
              ALL_PROTOCOLS.filter(({ id }) => id === data.protocolId)[0] ||
              null
          }
        })
      );
    } else if (type === 'create-scope') {
      // TODO: Patrick we need to store this somewhere!
      const creatorInstanceId = data.instanceId;
      const participants = data.participants;
      const protocolId = data.protocolId;

      const scopeId = uuid();

      ws.send(
        JSON.stringify({
          type,
          data: {
            ...data,
            scopeId
          }
        })
      );
    }
  });
});

import WebSocket from 'ws';

const port = process.env.PORT || 3000;
const wss = new WebSocket.Server({ port });

wss.on('connection', ws => {
  console.log('Syft connected');

  ws.on('close', () => {
    console.log('Syft disconnected');
  });

  ws.on('message', message => {
    console.log('Message:', message);
    ws.send(message);
  });
});

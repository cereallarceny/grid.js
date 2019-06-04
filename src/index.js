import express from 'express';
import http from 'http';
import socketIO from 'socket.io';
import compression from 'compression';

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

const port = process.env.PORT || 3000;

app.use(compression({}));

io.on('connection', socket => {
  console.log('Syft connected');

  socket.on('disconnect', () => {
    console.log('Syft disconnected');
  });

  socket.on('syft', msg => {
    console.log('Message:', msg);
  });
});

server.listen(port, () => {
  console.log(`Listening on http://localhost:${port}`);
});

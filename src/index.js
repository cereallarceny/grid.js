const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const port = process.env.PORT || 3000;

app.get('/', function(req, res) {
  res.send('Welcome to the Syft Grid!');
});

io.on('connection', function(socket) {
  console.log('Syft connected');

  socket.on('disconnect', function() {
    console.log('Syft disconnected');
  });

  socket.on('syft', function(msg) {
    console.log('Message:', msg);
  });
});

http.listen(port, function() {
  console.log(`Listening on http://localhost:${port}`);
});

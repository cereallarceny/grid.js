var app = require("express")();
var http = require("http").Server(app);
var io = require("socket.io")(http);

app.get("/", function(req, res) {
  res.send("Welcome to the Syft Grid!");
});

io.on("connection", function(socket) {
  console.log("Syft connected");

  socket.on("disconnect", function() {
    console.log("Syft disconnected");
  });

  socket.on("syft", function(msg) {
    console.log("Message:", msg);
  });
});

http.listen(3000, function() {
  console.log("listening on http://localhost:3000");
});

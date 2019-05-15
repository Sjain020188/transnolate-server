const express = require("express");
const morgan = require("morgan");

const http = require("http");
const socketio = require("socket.io");

const app = express();
app.use(
  morgan(
    ':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] :response-time ms'
  )
);

app.get("/user", (req, res) => {
  res.send("Welcome to chatssapp");
});

var server = http.createServer(app);
var io = socketio(server);

io.on("connection", function(socket) {
  var online = Object.keys(io.engine.clients);

  io.emit("server message", JSON.stringify(online));

  socket.on("disconnect", function() {
    var online = Object.keys(io.engine.clients);
    io.emit("server message", JSON.stringify(online));
  });
});
server.listen(3000, () => console.log("we up."));

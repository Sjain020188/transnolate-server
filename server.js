const express = require("express");
const morgan = require("morgan");

const http = require("http");
const socketio = require("socket.io");
let onlineusers = {};

const app = express();
app.use(
  morgan(
    ':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] :response-time ms'
  )
);

app.get("/", (req, res) => {
  res.send("Welcome to chatssapp");
});

var server = http.createServer(app);
var io = socketio(server);

io.on("connection", function(socket) {
  var online = Object.keys(io.engine.clients);

  io.emit("server message", JSON.stringify(online));

  socket.on("new user", function(data) {
    socket.nickname = data;
    onlineusers[data] = "online";
  });

  io.emit("users", onlineusers);

  socket.on("disconnect", function() {
    var online = Object.keys(io.engine.clients);
    io.emit("server message", JSON.stringify(online));
  });
});

server.listen(process.env.PORT || 3000, () => console.log("we up."));

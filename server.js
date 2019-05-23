const express = require("express");
const morgan = require("morgan");
const http = require("http");
const socketio = require("socket.io");
const db = require("./knex");

const app = express();
let onlineusers = {};

app.use(
  morgan(
    ':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] :response-time ms'
  )
);

app.use(express.json());

app.get("/", (req, res) => {
  res.send("Welcome to chatssapp");
});

app.get("/users/:username", async (req, res) => {
  const user = await db("users")
    .select("first_name", "last_name", "phone_number", "username", "email")
    .where({ username: req.params.username });
  res.send(user);
});

app.post("/users/review", async (req, res) => {
  const user = await db("user_review").insert(req.body);
  res.send("Added");
});

app.get("/reviews/:username", async (req, res) => {
  const user = await db("user_review")
    .select()
    .where({ username: req.params.username });
  res.send(user);
});
//socket io fro checking online users

const getUserNameByEmail = async email => {
  const user = await db("users")
    .select()
    .where({ email });
  console.log("user", user);
  return user[0].username;
};
let server = http.createServer(app);
let io = socketio(server);
io.on("connection", function(socket) {
  let online = Object.keys(io.engine.clients);
  io.emit("server message", JSON.stringify(online));
  socket.on("new user", function(data) {
    let name = getUserNameByEmail(data);
    name
      .then(nickname => {
        socket.nickname = nickname;
        onlineusers[nickname] = "online";
        let final = [];
        for (let nickname in onlineusers) {
          if (onlineusers[nickname] === "online") {
            final.push(nickname);

            io.emit("users", final);
          }
        }
      })
      .catch(err => console.log(err));
  });

  socket.on("disconnect", function(data) {
    console.log("disconecting", data);
    onlineusers[socket.nickname] = "offline";
    var online = Object.keys(io.engine.clients);
    io.emit("server message", JSON.stringify(online));
  });
});

server.listen(process.env.PORT || 3000, () => console.log("we up."));

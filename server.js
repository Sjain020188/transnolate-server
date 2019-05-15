const express = require("express");
const morgan = require("morgan");
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const http = require("http");
const socketio = require("socket.io");
const db = require("./knex");
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
    let final = [];
    for (let a in onlineusers) {
      if (onlineusers[a] === "online") {
        final.push(a);
      }
    }
    io.emit("users", final);
  });

  socket.on("disconnect", function(data) {
    onlineusers[socket.nickname] = "offline";
    var online = Object.keys(io.engine.clients);
    io.emit("server message", JSON.stringify(online));
  });
});

passport.use(
  "local",
  new LocalStrategy(
    { passRequestToCallback: true },
    async (username, password, done) => {
      await loginAttempt();
      async function loginAttempt() {
        try {
          const user = await db("users")
            .select()
            .where({ username });

          if (user.length === 0) {
            console.log("no user found");
            return done(null, false, { message: "Incorrect password." });
          } else {
            if (user[0].password === password) {
              return done(null, user);
            } else {
              return done(null, false, { message: "Incorrect password." });
            }
          }
        } catch (err) {
          console.log(err);
        }
      }
    }
  )
);

passport.serializeUser(function(user, done) {
  done(null, user);
});
passport.deserializeUser(function(user, done) {
  done(null, user);
});

app.post("/register", (req, res, next) => {
  return authHelpers
    .createUser(req, res)
    .then(response => {
      passportSettings.authenticate("local", (err, user, info) => {
        if (user) {
          handleResponse(res, 200, "success");
        }
      })(req, res, next);
    })
    .catch(err => {
      handleResponse(res, 500, "error");
    });
});

app.post("/users", async (req, res) => {
  try {
    const user = await db("users").insert(req.body);

    res.json("User added successfully");
  } catch (err) {
    console.log(err);
  }
});

app.post("/login", function(req, res, next) {
  passport.authenticate("local", { session: true }, (err, user, info) => {
    if (err || !user) {
      return res.status(400).json({
        message: "Something is not right",
        user: user
      });
    }
    req.login(user, { session: true }, err => {
      if (err) {
        res.send(err);
      }
      const token = jwt.sign(user, "your_jwt_secret");
      return res.json({ user, token });
    });
  })(req, res);
});

app.get("/success", (req, res) => {
  res.json("SUCCESS");
});

app.get("/failure", (req, res) => {
  res.json("FAILURE");
});

server.listen(process.env.PORT || 3000, () => console.log("we up."));

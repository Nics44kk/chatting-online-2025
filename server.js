// server.js
const express = require("express");
const http = require("http");
const socketIo = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Keep track of connected users
let users = [];

app.use(express.static("public"));

// When a new user connects
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // Add user to the list of online users
  users.push(socket.id);

  // Pair two users when there are at least 2 users connected
  if (users.length >= 2) {
    const user1 = users.pop();
    const user2 = users.pop();

    io.to(user1).emit("paired", { partner: user2 });
    io.to(user2).emit("paired", { partner: user1 });
  }

  // Handle chat messages
  socket.on("chat_message", (message) => {
    io.to(socket.id).emit("chat_message", message);  // Echo the message back
  });

  // When a user disconnects, remove them from the user list
  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
    users = users.filter((user) => user !== socket.id);
  });
});

server.listen(3000, () => {
  console.log("Server running on port 3000");
});

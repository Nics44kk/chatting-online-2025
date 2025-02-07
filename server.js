// server.js (Backend)

const express = require("express");
const http = require("http");
const socketIo = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Keep track of connected users
let users = [];

app.use(express.static("public"));

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

  // When a user sends an offer
  socket.on("offer", (data) => {
    io.to(data.partner).emit("offer", data.offer);
  });

  // When a user sends an answer
  socket.on("answer", (data) => {
    io.to(data.partner).emit("answer", data.answer);
  });

  // When a user sends an ICE candidate
  socket.on("ice_candidate", (candidateData) => {
    io.to(candidateData.partner).emit("ice_candidate", candidateData.candidate);
  });

  // When a user disconnects
  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
    users = users.filter((user) => user !== socket.id);
  });
});

server.listen(3000, () => {
  console.log("Server running on port 3000");
});

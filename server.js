// server.js
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const roomCapacity = 2; // Number of users per room
let rooms = {}; // Store rooms and users

// Serve static files from the 'public' folder
app.use(express.static(path.join(__dirname, 'public')));

// Handle when a user connects
io.on('connection', (socket) => {
    console.log('A user connected');

    let assignedRoom = null;

    // Find an available room with space
    for (let room in rooms) {
        if (rooms[room].length < roomCapacity) {
            assignedRoom = room;
            break;
        }
    }

    // If no room is available, create a new room
    if (!assignedRoom) {
        assignedRoom = `room${Object.keys(rooms).length + 1}`;
        rooms[assignedRoom] = [];
    }

    // Add user to the assigned room
    rooms[assignedRoom].push(socket.id);
    socket.join(assignedRoom);
    console.log(`User ${socket.id} joined ${assignedRoom}`);

    // Inform the users that they are connected to a room
    socket.emit('receive-message', `You are connected to ${assignedRoom}. Start chatting!`);
    socket.to(assignedRoom).emit('receive-message', `User ${socket.id} joined the chat in ${assignedRoom}.`);

    // Handle sending messages within the room
    socket.on('send-message', (message) => {
        io.to(assignedRoom).emit('receive-message', message); // Broadcast to the room
    });

    // Handle disconnection and clean up
    socket.on('disconnect', () => {
        console.log('A user disconnected');
        // Remove user from the room
        rooms[assignedRoom] = rooms[assignedRoom].filter(user => user !== socket.id);
        if (rooms[assignedRoom].length === 0) {
            delete rooms[assignedRoom];
        }
    });
});

server.listen(3000, () => {
    console.log('Server is running on http://localhost:3000');
});

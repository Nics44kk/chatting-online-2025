const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

let users = [];

io.on('connection', (socket) => {
    console.log('A user connected');
    
    // Add user to the waiting list
    users.push(socket);

    // If there is a user waiting for a match, pair them
    if (users.length >= 2) {
        const user1 = users.shift();
        const user2 = users.shift();

        // Notify both users they are matched
        user1.emit('receive-message', 'You are connected! Start chatting.');
        user2.emit('receive-message', 'You are connected! Start chatting.');

        // Message handling between the two users
        user1.on('send-message', (message) => {
            user2.emit('receive-message', message);
        });

        user2.on('send-message', (message) => {
            user1.emit('receive-message', message);
        });

        // Disconnect handling
        user1.on('disconnect', () => {
            console.log('User 1 disconnected');
        });
        user2.on('disconnect', () => {
            console.log('User 2 disconnected');
        });
    }
});

server.listen(3000, () => {
    console.log('Server is running on http://localhost:3000');
});

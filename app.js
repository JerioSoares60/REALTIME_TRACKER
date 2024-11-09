
const express = require('express');
const app = express();

// Serve static files from the 'public' directory
app.use(express.static('public'));

const path = require("path");
const http = require('http');

const socketio = require('socket.io');

const server = http.createServer(app);

const io = require('socket.io')(server);
app.set("view engine", "ejs");
app.set(express.static(path.join(__dirname, "public")));



io.on('connection', (socket) => {
    console.log('New user connected:', socket.id);

    socket.on('send-location', ({latitude, longitude}) => {
        // Log the broadcast
        console.log(`Broadcasting location from ${socket.id}:`, {latitude, longitude});
        
        // Broadcast to ALL clients
        io.emit('receive-location', {
            id: socket.id,
            latitude,
            longitude
        });
        
        // Log current connections
        const connectedSockets = Array.from(io.sockets.sockets.keys());
        console.log('Currently connected sockets:', connectedSockets);
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        io.emit('user-disconnected', socket.id);
    });
});

app.get('/', function(req, res) {
    res.render("index");
})

server.listen(3000);
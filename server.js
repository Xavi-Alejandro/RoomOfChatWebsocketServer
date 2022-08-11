const express = require('express');
const app = express();

const HTTP_PORT = process.env.PORT || 8080;

//Setup socket.io
let http = require('http').Server(app);
const io = require('socket.io')(http, {
    cors: {}
});

//Store websocket connections
let socketUsers = [];

io.on('connection', function (socket) {

    //Assign temp username and push object into array
    let tempUserName = "User-" + Math.floor(Math.random() * (100000 - 1 + 1)) + 1;
    socketUsers.push({ socket: socket, userName: tempUserName });

    //Let clients know number of users online
    for (let i = 0; i < socketUsers.length; i++) {
        if (socketUsers[i].socket.id != socket.id)
            io.to(socketUsers[i].socket.id).emit('chat message', 'New user has connected!');
        else {
            if (socketUsers.length < 2)
                io.to(socketUsers[i].socket.id).emit('chat message', 'Welcome! You are currently the only person here');
            else if (socketUsers.length == 2)
                io.to(socketUsers[i].socket.id).emit('chat message', 'Welcome! There is currently one other user connected');
            else
                io.to(socketUsers[i].socket.id).emit('chat message', `Welcome! there  are ${socketUsers.length - 1} other users connected`);
        }
    }

    //Let clients know which user disconnected and remove him from the array
    socket.on('disconnect', function () {
        for (let i = 0; i < socketUsers.length; i++) {
            if (socketUsers[i].socket.connected === false) {
                io.emit('chat message', `${socketUsers[i].userName} has disconnected`);
                socketUsers.splice(i, 1);
                break;
            }
        }
    })

    //Check for incomming chat messages and re-emit them
    socket.on('chat message', function (user) {
        if (!user.nickName)
            user.nickName = tempUserName;
        io.emit('chat message', user.nickName + ": " + user.message);
    })

    //If client updated their nickname/username, we update our array
    socket.on('usernameUpdated', function (user) {
        for (let i = 0; i < socketUsers.length; i++) {
            if (socketUsers[i].userName === tempUserName) {
                socketUsers[i].userName = user.nickName;
                break;
            }
        }
        io.emit('chat message', `"${tempUserName}" is now "${user.nickName}"`);
    })
})

//Listen on port
http.listen(HTTP_PORT, () => {
    console.log("listening on: " + HTTP_PORT);
})
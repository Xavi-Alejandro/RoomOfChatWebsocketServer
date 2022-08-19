const express = require('express');
const app = express();
const HTTP_PORT = process.env.PORT || 8080;

//Keep track of date and time

//Setup socket.io
let http = require('http').Server(app);
const io = require('socket.io')(http, {
    cors: {}
});
//Add a map of all clients
let clientMap = new Map();

//messageGivenClient
/*This function receives a socket and a message to be sent to an individual cient */
let messageClient = function (clientSocket, clientMessageObject) {
    io.to(clientSocket.id).emit('chat message', clientMessageObject);
}

io.on('connection', function (socket) {
    //Assign temp username and add to clientMap
    let tempUsername = "User-" + Math.floor(Math.random() * (100000 - 1 + 1)) + 1;
    clientMap.set(socket.id, { socket: socket, userName: tempUsername });

    //send recently connected user their temp username
    io.to(socket.id).emit('tempUsername', { tempUsername: tempUsername })
    //Let clients know number of users online
    clientMap.forEach((objectReference, key) => {
        let socketItselt = objectReference.socket;
        let socketId = key;
        if (socketId === socket.id) {
            let message;
            if (clientMap.size < 2)
                message = 'Welcome! You are currently the only person here'
            else if (clientMap.size === 2)
                message = 'Welcome! There is 1 more user connected';
            else
                message = `Welcome! There are ${clientMap.size - 1} other users connected`;
            messageClient(socketItselt, { message: message });
        }
        else
            messageClient(socketItselt, { message: `A new user has connected` });
    })

    //Let clients know which user disconnected and remove him from the array
    socket.on('disconnect', function () {
        io.emit('chat message', { message: `${clientMap.get(socket.id).userName} has disconnected!` });
        clientMap.delete(socket.id);
    })

    //Check for incomming chat messages and re-emit them
    socket.on('chat message', function (user) {
        //Add timestamp
        let todaysDate = new Date(Date.now());
        if (!user.nickName)
            user.nickName = clientMap.get(socket.id).userName;
        io.emit('chat message', { serverDate: todaysDate, nickName: user.nickName, message: `${user.nickName}: ${user.message}` });
    })

    //If client updated their nickname/username, we update our array
    socket.on('usernameUpdated', function (user) {
        io.emit('chat message', { message: `${clientMap.get(socket.id).userName} is now ${user.nickName}` })
        clientMap.set(socket.id, { socket: socket, userName: user.nickName });
    })

    //Notify clients except for current client that someone is typing
    socket.on('someone is typing', function () {
        console.log('someone is typing!')
        clientMap.forEach((objectReference, key) => {
            let socketItselt = objectReference.socket;
            let socketId = key;
            if (socketId !== socket.id) {
                io.to(socketItselt.id).emit('someone is typing', {});
            }
        })
    })

    socket.on('cut off typing', function () {
        console.log('cut off typing!')
        clientMap.forEach((objectReference, key) => {
            let socketItselt = objectReference.socket;
            let socketId = key;
            if (socketId !== socket.id) {
                io.to(socketItselt.id).emit('cut off typing', {});
            }
        })
    })
})

//Listen on port
http.listen(HTTP_PORT, () => {
    console.log("listening on: " + HTTP_PORT);
})
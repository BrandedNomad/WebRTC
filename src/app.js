const express = require('express');
let http = require('http')
const socketio = require('socket.io')
const path = require('path')

//create server
const app = express()
const server = http.createServer(app)
const io = socketio(server)


//configure

////set port
const port = process.env.PORT

////Public folder
const publicDirectoryPath = path.join(__dirname,'../public')
app.use(express.static(publicDirectoryPath))


//sockets
io.on('connection',(socket)=>{
    console.log('A user connected')

    socket.on('create or join',(room)=>{
        console.log('create or join to room ',room)
        const myRoom = io.sockets.adapter.rooms[room] || {length:0}//counts users in room
        const numClients = myRoom.length
        console.log(room, ' has ', numClients, ' clients')

        if(numClients === 0 ){
            socket.join(room)
            socket.emit('created', room)
        }else if(numClients === 1){
            socket.join(room)
            socket.emit('joined', room)
        }else{
            socket.emit('full', room)
        }
    })

    socket.on('ready', (room)=>{
        socket.broadcast.to(room).emit('ready')
    })

    socket.on('candidate',(event)=>{
        socket.broadcast.to(event.room).emit('candidate',event)
    })

    socket.on('offer',(event)=>{
        socket.broadcast.to(event.room).emit('offer',event.sdp)
    })

    socket.on('answer',(event)=>{
        socket.broadcast.to(event.room).emit('answer', event.sdp)
    })
})

//Start server
server.listen(port,(error,response)=>{
    if(error){
        console.log(error)
    }else{
        console.log("Server is up and running on port: " + port)
    }
})
const http = require('http')
const server = http.createServer()
const { Server } = require("socket.io");
const io = new Server(server, { cors: true });
const numbers = ['2', '3', "4", "5", "6", "7", "8", "9", '10', 'j', 'q', 'k', 'a']
const shapes = ['diamond', 'club', 'spade', 'heart']
let rooms = []



function createRoom() {

}

function joinRoom() {

}

function prepareDeck(deckSize = 36) {
  let deck = []
  let start = deckSize == 24 ? 7 : deckSize == 36 ? 5 : deckSize == 52 ? 0 : 0
  for (let i = 0; i < shapes.length; i++) {
    for (let j = start; j < numbers.length; j++) {
      deck.push({ value: numbers[j], shape: shapes[i] })
    }
  } // full deck
  for (let i = 0; i < deck.length; i++) {
    let random = Math.floor(Math.random() * deck.length)
    let q = deck[i]
    let t = deck[random]
    deck[i] = t
    deck[random] = q
  } // shuffle
  return deck
}

function shareDeck(){

}

function startGame(id, player = 2, deckSize = 36) {
  let game = { id: 1, deck: [], deckSize, playerCount, players: [], trump: undefined, middle: [] }


  for (let i = 1; i <= playerCount; i++) {
    let arr = []
    for (let i = 0; i < 6; i++) {
      let random = Math.floor(Math.random() * deck.length)
      arr.push(deck.splice(random, 1)[0])
    }
    game.players.push({ number: i, deck: arr })
  }
  game.deck = deck
}


io.on('connection', (socket) => {
  console.log(socket.id + ' user connected');
  socket.on('createRoom', async (data) => {
    let random = Math.random().toString(36).slice(2, 7)
    let obj = {
      status: "waiting",
      roomId: random,
      joined: 1,
      playerCount: data.playerCount,
      deckSize: data.deckSize,
      transfer: false,
      timer: 15,
      players: [{ socketId: socket.id, playerNumber: 1 }],
      middle: [],
    }
    rooms.push(obj)
    await socket.join(random)
    io.to(socket.id).emit('createRoom', { playerNumber: 1, room: obj })
  })

  socket.on('joinRoom', async (data) => {
    if (!io.sockets.adapter.rooms.has(data.roomId)) return false
    console.log('joining', data.gameId)
    await socket.join(data.roomId)
    let index = rooms.findIndex(r => r.roomId === data.roomId)
    rooms[index].joined++
    let playerNumber = rooms[index].players.at(-1).playerNumber + 1
    let player = { socketId: socket.id, playerNumber }
    rooms[index].players.push(player)
    io.to(socket.id).emit('joinRoom', { playerNumber: playerNumber, room: rooms[index] })

    if (rooms[index].joined == rooms[index].playerCount) {
      for (let i = 0; i < rooms[index].players.length; i++) {
        io.to(rooms[index].players[i].socketId).emit('status', { status: "starting" })
        rooms[index].players[i].timer = setTimeout(() => {
          rooms[index].players.splice(i, 1)
          rooms[index].joined--
          console.log('user not joined', rooms[index].players)
        }, 10000)
      }

    }
    console.log(index, io.sockets.adapter.rooms)
  })

  socket.on('ready', async (data) => {
    let index = rooms.findIndex(r => r.roomId === data.roomId)
    if (index < 0) return false
    rooms[index].players.forEach(player => {
      if (player.socketId == socket.id) {
        player.status = 'ready'
        clearInterval(player.timer)
      }
    })
    let areAllReady = rooms[index].players.every(player => player.status == 'ready')
    if (areAllReady) {
      rooms[index].deck =  prepareDeck()
      console.log(rooms[index].deck)
    }
  })

  socket.on('disconnect', () => {
    let index = rooms.findIndex(r => r.players.some(t => t.socketId == socket.id))
    if (index > -1) {
      rooms.splice(index, 1)
    }
    console.log('disconnected', index, rooms)
  })


});


server.listen(3000, () => console.log('Socket io started'))
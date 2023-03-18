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
  let start = deckSize == 24 ? 7 : deckSize == 36 ? 4 : deckSize == 52 ? 0 : 0
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

function shareDeck() {

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

  socket.on('joinLobby', async () => {
    await socket.join('lobby')
    io.to(socket.id).emit('update', { rooms: rooms.filter(x => x.status == "waiting") })
  })

  socket.on('createRoom', async (data) => {
    console.log('data', data)
    if (![24, 36, 52].includes(data.deckSize)) return false
    if (![2, 3, 4, 5, 6].includes(data.playerCount)) return false
    await socket.leave('lobby') // leave loby
    let random = Math.random().toString(36).slice(2, 7)
    let obj = {
      status: "waiting",
      id: random,
      joined: 1,
      playerCount: data.playerCount,
      deckSize: data.deckSize,
      transfer: false,
      timer: 15,
      players: [{ socketId: socket.id, number: 1 }],
      middle: [],
    }
    rooms.push(obj)
    emitRooms()
    io.to(socket.id).emit('update', { playerNumber: 1, room: obj })
  })

  socket.on('joinRoom', async (data) => {
    let index = rooms.findIndex(r => r.id === data.id)
    if (index === -1) { console.log('room not found'); return false }
    if (rooms[index].playerCount == rooms[index].joined) { console.log(" Maximum user "); return false }
    console.log('joining', data.gameId)
    await socket.leave('lobby')
    rooms[index].joined++
    let playerNumber 
    for (let i=1;i<rooms[index].playerCount;i++){
      let isExists =  rooms[index].players.some(p => p.number == i)
      if (isExists) { playerNumber = i ; break}
    }
    console.log('playerNumber', player)
    let player = { socketId: socket.id, playerNumber }
    rooms[index].players.push(player)
    io.to(socket.id).emit('update', { playerNumber: playerNumber, room: rooms[index] })

    if (rooms[index].joined == rooms[index].playerCount) {
      for (let i = 0; i < rooms[index].players.length; i++) {
        io.to(rooms[index].players[i].socketId).emit('update', { status: "starting" })
        // rooms[index].players[i].timer = setTimeout(() => {
        //   rooms[index].players.splice(i, 1)
        //   rooms[index].joined--
        //   console.log('user not joined', rooms[index].players)
        // }, 10000)
      }
    }
    socket.emit('update', { rooms: rooms.filter(r => r.status == "waiting") })
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
      console.log('started')
      rooms[index].status = "started"
      rooms[index].deck = prepareDeck()
      rooms[index].trump = rooms[index].deck.at(-1)
      rooms[index].attacker = 0
      rooms[index].defender = 1
      for (let i = 0; i < rooms[index].players.length; i++) {
        rooms[index].players[i].deck = rooms[index].deck.splice(0, 6)
        io.to(rooms[index].players[i].socketId).emit('deck', { deck: rooms[index].players[i].deck, })
        console.log('w', rooms[index].players[i].deck)
      }
    }
  })

  socket.on('attackToMiddle', async (data) => {
    let index = rooms.findIndex(r => r.roomId === data.roomId)
    if (index == -1) return false
    let playerIndex = rooms[index].players.findIndex(r => r.socketId === socket.id)
    if (playerIndex == -1) return false
    let playerNumber = rooms[index].players[playerIndex].playerNumber
    if (rooms[index].attacker != playerNumber) return false

    if (rooms[index].middle.length == 0) {
      let card = rooms[index].players[playerIndex].deck.splice(data.cardIndex, 1)[0]
      rooms[index].middle.push({ ...card, slot: 1 })
      rooms[index].players.forEach(p => io.to(p.socketId).emit('update', { middle: rooms[index].middle }))
    } else {
      let isExists = rooms[index].middle.some(x => x.value == rooms[index].players[playerIndex].deck[data.cardIndex].value)
      if (!isExists) return false
      let card = rooms[index].players[playerIndex].deck.splice(data.cardIndex, 1)[0]
      let cardSlot = 0
      rooms[index].middle.forEach(x => { if (x.slot % 2 == 1 && x > cardSlot) { cardSlot = x.slot } })
      cardSlot += 2
      middle.push({ ...card, cardSlot })

    }
    rooms[index].players.forEach((p, j) => io.to(p.socketId).emit('update', { middle: rooms[index].middle, players: filterPlayersData(index, j) }))

  })

  socket.on('defendToMiddle', async (data) => {
    let index = rooms.findIndex(r => r.roomId === data.roomId)
    if (index == -1) return false
    let playerIndex = rooms[index].players.findIndex(r => r.socketId === socket.id)
    if (playerIndex == -1) return false
  })

  socket.on('done', async (data) => {

  })

  socket.on('take', async (data) => {
    let index = rooms.findIndex(r => r.roomId === data.roomId)
    if (index == -1) return false
    let playerIndex = rooms[index].players.findIndex(r => r.socketId === socket.id)
    if (playerIndex == -1) return false // all validation

    if (rooms.defender != rooms[index].players[playerIndex]) return false
    if (rooms[index].middle.length == 0) return false
    // rooms[index].player 
  })


  socket.on('disconnect', () => {
    let index = rooms.findIndex(r => r.players.some(t => t.socketId == socket.id))
    if (index > -1) {
      rooms[index].joined--
      if (rooms[index].status == "playing") {
        // lose money
      }
      if (rooms[index].joined == 0) {
        rooms.splice(index, 1)
      }
      emitRooms()
    }
    console.log('disconnected', index, rooms)
  })


});


function emitRooms() {
  io.to('lobby').emit('update', { rooms: rooms.filter(x => x.status == "waiting") })

}


function filterPlayersData(index, playerIndex) {
  let data = rooms[index].players.map((i, j) => {
    i.deckCount = i.deck.length
    if (playerIndex != j) {
      i.deck = []
    }
    return i
  })
  console.log('filterPlayersData', data)
  return data
}


server.listen(3000, () => console.log('Socket io started'))
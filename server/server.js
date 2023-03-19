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



io.on('connection', (socket) => {
  console.log(socket.id + ' user connected');
  socket.on('joinLobby', async () => {
    await socket.join('lobby')
    emitRooms()
  })

  socket.on('createRoom', async (data) => {
    // console.log('data', data)
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
    console.log('joining', data.id)
    await socket.leave('lobby')
    rooms[index].joined++
    let number
    for (let i = 1; i <= rooms[index].playerCount; i++) {
      let isExists = rooms[index].players.some(p => p.number == i)
      if (!isExists) { number = i; break }
    }

    console.log('playerNumber', number)
    rooms[index].players.push({ socketId: socket.id, number })
    io.to(socket.id).emit('update', { playerNumber: number })
    if (rooms[index].joined == rooms[index].playerCount) {
      rooms[index].status = "starting"
      rooms[index].players.forEach(p => {
        // p.timerFinish = Date.now() + 10000
        // let a = setTimeout(async () => {
        //   let playerIndex = rooms[index].players.find(x => x.socketId === socket.id)
        //   rooms[index].joined--
        //   rooms[index].status = "waiting"
        //   rooms[index].players.splice(playerIndex, 1)
        //   io.to(socket.id).emit('update', { room: {} })
        //   await socket.join('lobby')
        //   // rooms[index].players.forEach(x => clearInterval(timer) )
        //   if (rooms[index].joined == 0) {
        //     rooms.splice(index, 1)
        //   }
        //   emitRooms()
        //   console.log('obb')
        // }, 10000)
        // p.a = {a}
        // console.log('a', a)
      })
    }
    emitRooms()
    emitRoom(rooms[index])
  })

  socket.on('ready', async (data) => {
    let index = rooms.findIndex(r => r.roomId === data.roomId)
    if (index < 0) return false
    let playerIndex = rooms[index].players.findIndex(p => p.socketId === socket.id)
    rooms[index].players[playerIndex].status = "ready"
    clearInterval(rooms[index].players[playerIndex].timer)

    emitRoom(rooms[index])


    let areAllReady = rooms[index].players.every(player => player.status == 'ready')
    if (areAllReady) {
      console.log('all ready')
      rooms[index].status = "started"
      rooms[index].deck = prepareDeck()
      rooms[index].trump = rooms[index].deck.at(-1)
      rooms[index].attacker = 1
      rooms[index].defender = 2
      for (let i = 0; i < rooms[index].players.length; i++) {
        rooms[index].players[i].deck = rooms[index].deck.splice(0, 6)
      }
      emitRoom(rooms[index])
      // rooms[index].players.forEach((p, j) => {
      //   io.to(p.socketId).emit('update', { players: filterPlayersData(index, p.number), })
      // })
    }
  })

  socket.on('attackToMiddle', async (data) => {
    let index = rooms.findIndex(r => r.id === data.roomId)
    if (index == -1) return false
    let room = rooms[index]
    let player = rooms[index].players.find( p => p.socketId == socket.id)
    if (!player) return false
    
    if (room.attacker != player.number) return false


    if ( room.middle.length == 0) {
      let card = player.deck.splice(data.cardIndex, 1)[0]
      room.middle.push({ ...card, slot: 1 })
      emitRoom(room)
    } else {
      let isExists = room.middle.some(x => x.value == player.deck[data.cardIndex].value)
      if (!isExists) return false
      let card = player.deck.splice(data.cardIndex, 1)[0]
      let cardSlot = 0
      rooms[index].middle.forEach(x => { if (x.slot % 2 == 1 && x > cardSlot) { cardSlot = x.slot } })
      cardSlot += 2
      room.middle.push({ ...card, cardSlot })

    }
    // rooms[index].players.forEach((p, j) => io.to(p.socketId).emit('update', { middle: rooms[index].middle, players: filterPlayersData(index, j) }))

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
    console.log('disconnected', socket.id, index)
  })


});


function emitRooms() {
  io.to('lobby').emit('update', { rooms: rooms.filter(x => x.status == "waiting") })
}
function emitRoom(room) {
  // console.log('emitting room', room)
  room.players.forEach(p => io.to(p.socketId).emit('update', { room: room }))
}


function filterPlayersData(index, playerNumber) {
  let data = rooms[index].players.map((i, j) => {
    console.log(i)
    i.deckCount = i.deck?.length
    if (i.number != playerNumber) {
      i.deck = []
    }
    return i
  })
  console.log('filterPlayersData', data)
  return data
}


server.listen(3000, () => console.log('Socket io started'))
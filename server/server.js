const http = require('http')
const server = http.createServer()
const { Server } = require("socket.io");
const io = new Server(server, { cors: true });
const numbers = ['2', '3', "4", "5", "6", "7", "8", "9", '10', 'j', 'q', 'k', 'a']
const shapes = ['diamond', 'club', 'spade', 'heart']
const { prepareDeck, canBeatCard } = require("./functions/custom")
let rooms = []





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
    let room = rooms.find(r => r.id == data.roomId)
    if (!room) return false
    let player = room.players.find(p => p.socketId === socket.id)
    if (!player) return false

    player.status = "ready"
    clearInterval(player.timer)
    emitRoom(room)


    let areAllReady = room.players.every(player => player.status == 'ready')
    if (areAllReady) {
      console.log('all ready')
      room.status = "started"
      room.deck = prepareDeck()
      room.trump = room.deck.at(-1)
      room.attacker = 1
      room.defender = 2
      for (let i = 0; i < room.players.length; i++) {
        room.players[i].deck = room.deck.splice(0, 6)
      }
      emitRoom(room)
    }
  })

  socket.on('attackToMiddle', async (data) => {
    let room = rooms.find(r => r.id == data.roomId)
    if (!room) return false
    console.log('attacking', data)
    let player = room.players.find(p => p.socketId == socket.id)
    if (!player) return false
    if (room.attacker != player.number) return false
    let cardIndex = player.deck.findIndex(c => c.id == data.cardId)
    if (cardIndex == -1) return false


    if (room.middle.length == 0) {
      let card = player.deck.splice(cardIndex, 1)[0]
      room.middle.push({ ...card, slot: 1 })
      emitRoom(room)
    } else {
      let isExists = room.middle.some(x => x.value == player.deck[cardIndex].value)
      if (!isExists) return false
      console.log('isExists', isExists)
      let card = player.deck.splice(cardIndex, 1)[0]
      let slot = 0
      room.middle.forEach(x => { if (x.slot % 2 == 1 && x.slot > slot) { slot = x.slot } })
      console.log('slot', slot)
      slot += 2
      room.middle.push({ ...card, slot: slot })
      emitRoom(room)
    }

  })

  socket.on('defendToMiddle', async (data) => {
    let room = rooms.find(r => r.id == data.roomId)
    if (!room) return false
    let player = room.players.find(p => p.socketId == socket.id)
    if (!player) return false
    if (room.defender != player.number) return false // check if really defender
    let cardIndex = player.deck.findIndex(c => c.id == data.cardId)
    if (cardIndex == -1) return false // check if card exists

    let slot = room.middle.find(r => r.slot % 2 == 1 && r.slot == data.slot)
    if (!slot) return false // check if slot exists

    let result = canBeatCard(player.deck[cardIndex], slot, room.trump)
    if (!result) return false // could not beat

    

    let card = player.deck.splice(cardIndex, 1)[0]
    room.middle.push({ ...card, slot: data.slot + 1 })

    let attackerCardCount = 0; let defenderCardCount = 0
    room.middle.forEach(x => x.slot % 2 == 1 ? attackerCardCount++ : defenderCardCount++)
    console.log('carcounter',attackerCardCount,defenderCardCount)
    if (attackerCardCount == defenderCardCount) {
      player.status = 'done'
    }


    emitRoom(room)
  })

  socket.on('done', async (data) => {
    let room = rooms.find(r => r.id == data.roomId)
    if (!room) return false
    let player = room.players.find(p => p.socketId == socket.id)
    if (!player) return false
    if (room.attacker != player.number) return false  // o

    let attackerCardCount = 0; let defenderCardCount = 0
    room.middle.forEach(x => x.slot % 2 == 1 ? attackerCardCount++ : defenderCardCount++)

    let defender = room.players.find(p => p.number == room.defender)
    if (defender.status == 'take') {
      defender.deck.push(...room.middle)
      room.middle = []
      room.attacker += 2
      room.defender += 2
    } else if (defender.status == "done") {
      room.middle = []
      room.attacker += 1
      room.defender += 1
    }

    if (room.attacker > room.playerCount) room.attacker -= room.playerCount
    if (room.defender > room.playerCount) room.defender -= room.playerCount
    room.players.forEach(p => {
      p.status = ""
      if (room.deck.length > 0 && p.deck.length < 6) {
        p.deck.push(...room.deck.splice(0, 6 - p.deck.length))
        console.log('adding extra cards', )
      }
    })

    emitRoom(room)


  })

  socket.on('take', async (data) => {
    let room = rooms.find(r => r.id == data.roomId)
    if (!room) return false
    let player = room.players.find(p => p.socketId == socket.id)
    if (!player) return false
    if (room.defender != player.number) return false  // only defender can take

    let attackerCardCount = 0; let defenderCardCount = 0
    room.middle.forEach(x => x.slot % 2 == 1 ? attackerCardCount++ : defenderCardCount++)
    if (attackerCardCount == defenderCardCount) return false // hey you can't take it
    player.status = "take"

    emitRoom(room)

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
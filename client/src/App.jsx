import { useEffect, useRef, useState } from "react"
import { io } from 'socket.io-client';
import { ClosedCard } from "./components/Card";
import { CountdownCircleTimer } from 'react-countdown-circle-timer'

import cardSvg from "./assets/svg/closed-card.png"
import Lobby from "./components/Lobby";
const socket = io("http://localhost:3000");
function App() {

  let [room, setRoom] = useState({})
  let [rooms, setRooms] = useState([])
  let [playerNumber, setPlayerNumber] = useState()
  // let [onlineUsers, setOnlineUsers] = useState()

  useEffect(() => {
    socket.on('createRoom', (data) => {
      console.log('data', data)
      setPlayerNumber(data.playerNumber)
      setRoom(data.room)
    })
    socket.on('joinRoom', (data) => {
      console.log('join', data)
      setPlayerNumber(data.playerNumber)
      setRoom(data.room)
    })
    socket.on('disconnect', () => {
      setRoom({})
      setPlayerNumber()
    })
    socket.on('update', (data) => {
      console.log('update', data)
      if (data.rooms) { setRooms(data.rooms) }
      if (data.room) { setRoom(data.room) }
      if (data.playerNumber) { setPlayerNumber(data.playerNumber) }

      if (data.middle) { setRoom({ ...room, middle: data.middle }) }
      if (data.players) { setRoom({ ...room, players: data.players }) }
      if (data.attacker) { setRoom({ ...room, attacker: data.attacker }) }
      if (data.defender) { setRoom({ ...room, defender: data.defender }) }
      if (data.status) { setRoom({ ...room, status: data.status }) }
    })
  }, [])


  function giveReady() {
    socket.emit('ready', { roomId: room.id })
  }
  function createRoom(deckSize,playerCount) {
    socket.emit('createRoom', { deckSize, playerCount })
  }
  function joinRoom(id) {
    socket.emit('joinRoom', { roomId: id })
  }
  function take() {
    socket.emit('take', { roomId: room.id, })
  }
  function leaveRoom(id){
    socket.emit('leaveRoom', { roomId : id })
  }
  function getMe() {
    let playerIndex = room.players.findIndex(p => p.number == playerNumber)
    return room.players[playerIndex]
  }
  function getDefender() {
    let defender = room.players.find(x => x.number == room.defender)
    return defender
  }
  function attackToMiddle(e) {

    if (room.attacker != playerNumber) { return false }
    let cardId = e.dataTransfer.getData('cardId')
    socket.emit('attackToMiddle', { cardId, roomId: room.id })
  }
  function defendToMiddle(e, slot) {
    if (room.defender != playerNumber) {
      console.log('You are not defending')
      return false
    }
    let cardId = e.dataTransfer.getData('cardId')
    console.log('defending to middle', cardId, slot)
    socket.emit('defendToMiddle', { cardId, slot, roomId: room.id })
  }
  function done() {
    console.log('done')
    socket.emit('done', { roomId: room.id })
  }

  useEffect(() => {
    socket.emit('joinLobby',)
  }, [])

  function renderTakeButton() {
    let attackerCardCount = 0; let defenderCardCount = 0
    room.middle.forEach(x => x.slot % 2 == 1 ? attackerCardCount++ : defenderCardCount++)
    // console.log('cardcounter', attackerCardCount, defenderCardCount)
    if (room.defender == playerNumber && defenderCardCount < attackerCardCount && getDefender().status != "take") {
      return < button className="btn py-3 px-4 bg-teal-600 hover:bg-teal-800 rounded-md " onClick={take}> Take </button>
    }
  }
  function renderDoneButton() {
    console.log('defender', getDefender())
    if (room.status == "started" && room.attacker == playerNumber && (getDefender().status == "take" || getDefender().status == "done")) {
      return <button onClick={done} className="py-2 px-3 text-white bg-teal-600 hover:bg-teal-800">  Done </button>
    }
  }
  function renderReadyButton() {
    if (room.status == "starting" && room.joined == room.playerCount && getMe().status != "ready") {
      return <button onClick={giveReady} className="py-2 px-3 text-white bg-teal-600 hover:bg-teal-800">  I am ready </button>
    }

  }



  function renderSlotPair(a, b) {

    let card1 = room.middle.find(c => c.slot == a)
    let card2 = room.middle.find(c => c.slot == b)


    return <div className={"relative flex  slot-" + a + "-" + b}>
      {card1 &&
        <div onDrop={(e) => { defendToMiddle(e, a) }}
          onDragOver={(e) => e.preventDefault()}
          className="text-xl border border-blue-400 "> {card1.value}    {card1.shape}
        </div>}

      {card2 && <div
        className="text-xl border border-blue-400 absolute left-10 top-10 ">
        {card2.value}    {card2.shape}

      </div>}
    </div>
  }


  return (
    <div className="App  min-h-screen bg-slate-100 ">
      <div className="container mx-auto py-8" style={{ maxWidth: "1200px" }} >

        {
          !room.id ?  <Lobby createRoom={createRoom}   joinRoom={joinRoom} rooms={rooms} />
          : <div>
            {room.players.map((p, j) => {
              if (p.number == playerNumber) return false
              return <div className="target-player">
                <p className="player-number"> Player Number  {p.number} </p>
                <div className="timer w-10">
                  {p.timerFinish && <CountdownCircleTimer size={80} isPlaying duration={Math.floor((p.timerFinish - Date.now()) / 1000)}
                    colors={['#004777', '#F7B801', '#A30000', '#A30000']} colorsTime={[7, 5, 2, 0]} >
                    {({ remainingTime }) => remainingTime}
                  </CountdownCircleTimer>}
                </div>
                <div className="deck">
                  {p.deck?.length > 0 && <ClosedCard count={p.deck.length} />}
                </div>
                <div className="status"> {room.status == "waiting" && room.joined == room.playerCount && p.status == "ready" ? <span> Ready </span> : ""}  </div>
                <div className="status"> {p.status} </div>
              </div>
            })}
            <div className="left-deck">
              {room.trump && < p> Trump {room.trump.value} {room.trump.shape} </p>}
              {room.trump && < p> Left Deck {room.deck.length}  </p>}
            </div>
            <div className="middle flex gap-12 border my-6 rounded-md " style={{ height: "100px" }} onDrop={attackToMiddle} onDragOver={(e) => e.preventDefault()} >
              {renderSlotPair(1, 2)}
              {renderSlotPair(3, 4)}
              {renderSlotPair(5, 6)}
              {renderSlotPair(7, 8)}
              {renderSlotPair(9, 10)}
              {renderSlotPair(11, 12)}

            </div>
            <div className="me flex ">
              <div className="number"> Player {playerNumber} </div>
              <div className="me-deck flex">
                {playerNumber && getMe().deck?.map((i, j) => <Card i={i} j={j} />)}
              </div>
              <p className="tip"> {room.attacker == playerNumber ? "Attack time" : room.defender == playerNumber ? "Defend time" : ""} </p>
              <div className="actions">
                {renderReadyButton()}
                {renderTakeButton()}
                {renderDoneButton()}
              </div>
            </div>

          </div>

        }

      </div>
    </div>
  )

}


function Card({ i, className, }) {
  return (
    <div draggable={true} onDragStart={(e) => e.dataTransfer.setData("cardId", i.id)}
      className={`text-xl py-3 px-2 w-16 border border-blue-300 flex flex-col items-center  ${className} `}>
      <p> {i.value.toUpperCase()}   </p>
      <p> {i.shape} </p>
    </div>


  )
}



export default App

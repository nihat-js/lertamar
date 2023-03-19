import { useEffect, useRef, useState } from "react"
import { io } from 'socket.io-client';
import { ClosedCard } from "./components/Card";
import { CountdownCircleTimer } from 'react-countdown-circle-timer'

import cardSvg from "./assets/svg/closed-card.png"
const socket = io("http://localhost:3000");
function App() {

  const inputDeckCount = useRef()
  const inputPlayerCount = useRef()

  let [input, setInput] = useState()
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
      setPlayerNumber()
      setRoom({})
    })
    socket.on('status', (data) => {
      console.log('status', data)
      setStatus(data.status)
    })
    socket.on('deck', (data) => {
      setDeck(data.deck)
      console.log('deck', data)
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
    socket.emit('ready', { roomId: room.roomId })
  }
  function createRoom() {
    socket.emit('createRoom', { deckSize: 36, playerCount: 2 })
  }
  function joinRoom(id) {
    socket.emit('joinRoom', { id: id })
  }
  function getMe() {
    let playerIndex = room.players.findIndex(p => p.number == playerNumber)
    return room.players[playerIndex]
  }
  function handleDrop(e) {
    if (room.attacker == playerNumber) {
      socket.emit('attackToMiddle', { cardIndex: e.dataTransfer.getData('cardIndex'), roomId: room.id })
    }
    // if (middle.length == 0 || middle.some(k => k.value == i.value)) {
    //   socket.emit('attackToMiddle', { card: i, cardIndex: j, roomId: room.roomId, })
    // }
  }
  useEffect(() => {
    socket.emit('joinLobby',)
  }, [])



  return (
    <div className="App  min-h-screen bg-slate-100 ">
      <div className="container mx-auto py-8" style={{ maxWidth: "1200px" }} >
        {/* <Card i={{ value: "a", shape: "circle" }} j={1} />
        <Card i={{ value: "9", shape: "circle" }} j={3} /> */}
        {/* <div className="middle flex py-4 px-2 border  "  style={{ height: "100px" }}>
          <div className="slot  flex ">
            {room.middle?.[0] && <Card i={room.middle?.[0]} />}
            {room.middle?.[1] && <Card className="ml-4" i={room.middle?.[1]} />}
          </div>
        </div> */}

        {
          !room.id ? <div className="py-4 px-5 rounded-md  bg-white shadow-md ">
            <div className="deck-count flex gap-6  items-center">
              <p className="text-2xl "> Deck Size </p>
              <div className="group flex gap-2">
                <input type="radio" name='deckSize' value="24" /> 24
                <input ref={inputDeckCount} type="radio" name='deckSize' value="36" checked /> 36
                <input type="radio" name='deckSize' value="52" /> 52
              </div>
            </div>

            <div className="player-count  flex gap-6   items-center">
              <p className="text-2xl"> Player Count  </p>
              <div className="group flex gap-2">
                <input type="radio" name='playerCount' value="24" /> 2
                <input ref={inputPlayerCount} type="radio" name='playerCount' value="36" checked /> 3
                <input type="radio" name='playerCount' value="52" /> 4
              </div>
            </div>
            <div className="button-wrap mt-3">
              <button onClick={() => createRoom()} className="bg-blue-600 hover:bg-blue-800 font-semibold text-white  py-2 px-2 rounded-md "> Create Room </button>
            </div>
            <div className="rooms-list mt-5">
              <h2 className="text-2xl font-semibold text-teal-800 "> Rooms List </h2>
              {rooms.map((i, j) => {
                return <div className="px-3 py-2 bg-teal-600 mt-4 text-white flex items-center gap-6 rounded-md" >
                  <div className="deck-count-wrap flex gap-2">
                    <img className="w-8" src={cardSvg} alt="" />
                    <span className="decks-count text-xl ">  {i.deckSize}  </span>
                  </div>
                  <p className="joined  rounded-md  px-3 py-2" > Joined {i.joined} / {i.playerCount} </p>
                  <button onClick={() => socket.emit('joinRoom', { id: i.id })}
                    className=" bg-amber-600 hover:bg-amber-800 text-white rounded-md  px-3 py-2" >  Join </button>
                </div>
              })}
            </div>
          </div> : <div>
            {room.status == "starting" && <button className="py-3 px-2 bg-teal-600 hover:bg-teal-800 text-white rounded-md" mt-2 onClick={() => giveReady()} > Give ready   </button>}
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
              </div>
            })}
            <div className="middle border my-6 rounded-md " style={{ height: "200px" }} onDrop={handleDrop} onDragOver={(e) => e.preventDefault()} >
              {room.middle.map((i, j) => { return <div className="text-xl border border-blue-400 "> {i.value}    {i.shape}   </div> })}
            </div>
            <div className="me flex ">
              <div className="number"> Player {playerNumber} </div>
              <div className="me-deck flex">
                {playerNumber && getMe().deck?.map((i, j) => <Card i={i} j={j} />)}
              </div>
              <p className="tip"> { room.attacker == playerNumber ? "Attack time" : room.defender == playerNumber ? "Defend time"  : "" } </p>
            </div>

          </div>

        }

      </div>
    </div>
  )
}


function Card({ i, j, className, attackToMidle, defendToMiddle }) {
  return (
    <div draggable={true} onDragStart={(e) => e.dataTransfer.setData("cardIndex", j)}
      className={`text-xl py-3 px-2 w-16 border border-blue-300 flex flex-col items-center  ${className} `}>
      <p> {i.value.toUpperCase()}   </p>
      <p> {i.shape} </p>
    </div>


  )
}



export default App

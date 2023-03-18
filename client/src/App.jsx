import { useEffect, useRef, useState } from "react"
import { io } from 'socket.io-client';
import { ClosedCard } from "./components/Card";
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
  let users = useState([{ status: '', deckCount: 5 }])

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
      if (data.middle) { setMiddle(data.middle) }
      if (data.players) { setRoom({ ...room, players: data.players }) }
      if (data.attacker) { setRoom({ ...room, attacker: data.attacker }) }
      if (data.defender) { setRoom({ ...room, defender: data.defender }) }
      if (data.playerNumber) { setPlayerNumber(data.playerNumber) }
      if (data.status) { setRoom({ ...room, status: data.status }) }
    })
  }, [])


  function giveReady() {
    socket.emit('ready', { roomId: room.roomId })
  }

  function attackToMidle(i, j) {
    if (middle.length == 0 || middle.some(k => k.value == i.value)) {
      socket.emit('attackToMiddle', { card: i, cardIndex: j, roomId: room.roomId, })
    }

  }
  function defendToMiddle() {

  }

  function createRoom() {
    socket.emit('createRoom', { deckSize: 36, playerCount: 2 })
  }
  function joinRoom(id) {
    socket.emit('joinRoom', { id: id })
  }



  useEffect(() => {
    socket.emit('joinLobby',)
  }, [])



  return (
    <div className="App  min-h-screen bg-slate-100 ">
      <div className="container mx-auto py-8" style={{ maxWidth: "1200px" }} >
        {
          !room.id && <div className="py-4 px-5 rounded-md  bg-white shadow-md ">
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
          </div>

        }

        {
          status == "starting" && <button onClick={() => giveReady()} > Give ready   </button>
        }
        <div className="left-deck">
          {/* Left Deck {game?.deck.length} */}
        </div>
        <div className="player-1 flex gap-2">
          {/* {players[playerNumber]?.deck.map((i, j) => { return <Card attackToMidle={attackToMidle} i={i} key={j} /> })} */}
        </div>

        <div className="middle" style={{ height: "200px" }}>
          {/* {middle.map((i, j) => { return <div className="text-xl border border-blue-400 "> {i.value}    {i.shape}   </div> })} */}
        </div>
        <div className="player-2 flex gap-2">
          {
            <ClosedCard count={6} />
          }
        </div>
      </div>

    </div>
  )
}


function Card({ i, j, attackToMidle, defendToMiddle }) {

  return (
    <div onClick={() => attackToMidle(i, j)}
      className="text-xl py-3 px-2 border border-blue-300 flex flex-col items-center">
      <p> {i.value.toUpperCase()}   </p>
      <p> {i.shape} </p>
    </div>


  )
}

function closedCard() {

}


export default App

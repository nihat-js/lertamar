import { useEffect, useState } from "react"
import { io } from 'socket.io-client';

const socket = io("http://localhost:3000");
function App() {
  let [input,setInput] = useState()
  let [room, setRoom] = useState({})
  let [middle, setMiddle] = useState([])
  let [status,setStatus] = useState("")
  let [playerNumber, setPlayerNumber] = useState()

  useEffect(() => {
    socket.on('createRoom', (data) => {
      console.log('data', data)
      setPlayerNumber(data.playerNumber)
      setRoom(data.room)
    })
    socket.on('joinRoom', (data) => {
      console.log('join',data)
      setPlayerNumber(data.playerNumber)
      setRoom(data.room)
    })
    socket.on('disconnect',()=>{
      setPlayerNumber()
      setRoom({})
    })
    socket.on('status',(data)=>{
      console.log('status',data)
      setStatus(data.status)
    })
  }, [])


  function giveReady(){
    socket.emit('ready',{roomId : room.roomId })
  }

  function attackToMidle(card) {
    // checked if it's your turn
    console.log('attacking', middle)
    if (middle.length == 0) {
      setMiddle([...middle, { ...card, slot: 1 }])
    } else {
      let isSameValueExists = middle.some(i => i.value == card.value)
      let lastAttackerSlot;
      if (isSameValueExists) {
        setMiddle([...middle, { ...card, slot }])
      }
      console.log('is', isSameValueExists)
    }

  }
  function defendToMiddle() {

  }

  function createRoom() {
    socket.emit('createRoom', { deckSize: 36, playerCount: 2 })
  }
  function joinRoom(){
    socket.emit('joinRoom', { roomId : input })
    console.log('input',input)
  }



  useEffect(() => {
    // startGame()
  }, [])



  return (
    <div className="App">
      {
        !room.roomId && <>
          <div className="deckSize">
            <p> Deck Size </p>
            <input type="radio" name='deckSize' value="24" /> 24
            <input type="radio" name='deckSize' value="36" checked /> 36
            <input type="radio" name='deckSize' value="52" /> 52
          </div>
          <div>
            <button onClick={() => createRoom()} className="bg-blue-700 text-white  py-3 px-2"> Create Room </button>
          </div>
          <div>
            <input value={input} onChange={(e)=> setInput(e.target.value) } className="border py-2 px-3 " type="text" />
            <button onClick={() => joinRoom()} > Join Room </button>
          </div>
        </>
      }
        {
          status == "starting" && <button onClick={ () => giveReady ()} > Give ready   </button>
        }
      <div className="left-deck">
        {/* Left Deck {game?.deck.length} */}
      </div>
      <div className="player-1 flex gap-2">
        {/* {game?.players[0].deck.map((i, j) => { return <Hand attackToMidle={attackToMidle} defendToMiddle={defendToMiddle} defender={true} i={i} key={j} /> })} */}
      </div>

      <div className="middle" style={{ height: "200px" }}>
        {/* {middle.map((i, j) => { return <div className="text-xl border border-blue-400 "> {i.value}    {i.shape}   </div> })} */}
      </div>
      <div className="player-2 flex gap-2">
        {
          // game?.players[1].deck.map((i, j) => <Hand attackToMidle={attackToMidle} defendToMiddle={defendToMiddle} attacker={true} i={i} key={j} />)
        }
      </div>
    </div>
  )
}


function Hand({ i, attacker, defender, attackToMidle, defendToMiddle }) {

  return (
    <div onClick={() => attacker ? attackToMidle(i) : defendToMiddle(i)}
      className="text-xl py-3 px-2 border border-blue-300 flex flex-col items-center">
      <p> {i.value.toUpperCase()}   </p>
      <p> {i.shape} </p>
    </div>


  )
}


export default App

import React, { useState } from 'react'

export default function Lobby({rooms,createRoom,joinRoom}) {

  let [radioDeckCount, setRadioDeckCount] = useState(24)
  let [radioPlayerCount, setRadioPlayerCount] = useState(2)

  return (
    <div className="py-4 px-5 rounded-md  bg-white shadow-md ">
      <div className="deck-count flex gap-6  items-center">
        <p className="text-2xl "> Deck Size </p>
        <div className="group flex gap-2">
          <input type="radio" name="a" onChange={(e) => setRadioDeckCount(24)} defaultChecked /> 24
          <input type="radio" name="a" onChange={(e) => setRadioDeckCount(36)} /> 36
          <input type="radio" name="a" onChange={(e) => setRadioDeckCount(52)} /> 52
        </div>
      </div>

      <div className="player-count  flex gap-6   items-center">
        <p className="text-2xl"> Player Count  </p>
        <div className="group flex gap-2">
          <input type="radio" name="b" onChange={(e) => setRadioPlayerCount(2)} defaultChecked /> 2
          <input type="radio" name="b" onChange={(e) => setRadioPlayerCount(3)} /> 3
          <input type="radio" name="b" onChange={(e) => setRadioPlayerCount(4)} /> 4
        </div>
      </div>
      <div className="button-wrap mt-3">
        <button onClick={() => createRoom(radioDeckCount,radioPlayerCount)} className="bg-blue-600 hover:bg-blue-800 font-semibold text-white  py-2 px-2 rounded-md "> Create Room </button>
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
            <button onClick={() => joinRoom(i.id)}
              className=" bg-amber-600 hover:bg-amber-800 text-white rounded-md  px-3 py-2" >  Join </button>
          </div>
        })}
      </div>
    </div>

  )
}

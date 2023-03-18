import closedCardSvg from "../assets/svg/closed-card.png"

export function ClosedCard({count, skin}) {
  return (
    <div className="flex">
      { 
        [...new Array(count)].map( (i,j) => <img className="w-20 -ml-10 align-middle" key={j} src={closedCardSvg}  /> )
      }
    </div>
  )
}
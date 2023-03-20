const numbers = ['2', '3', "4", "5", "6", "7", "8", "9", '10', 'j', 'q', 'k', 'a']
const shapes = ['diamond', 'club', 'spade', 'heart']
function prepareDeck(deckSize = 36) {
  let deck = []
  let start = deckSize == 24 ? 7 : deckSize == 36 ? 4 : deckSize == 52 ? 0 : 0
  for (let i = 0; i < shapes.length; i++) {
    for (let j = start; j < numbers.length; j++) {
      deck.push({ value: numbers[j], shape: shapes[i], id: Math.random().toString(36).slice(2, 7) })
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

function canBeatCard(main, secondary, trump) {
  console.log('canBeatCard', main, secondary, trump)
  if ((main.shape == secondary.shape && numbers.indexOf(main.value) > numbers.indexOf(secondary.value)) ||
    (main.shape != secondary.shape && main.shape == trump.shape)
  ) {
    return true
  }
}

module.exports = { prepareDeck, canBeatCard }
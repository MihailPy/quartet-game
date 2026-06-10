package game

const MinCardsPerPlayer = 2

func MaxPlayersForDeck(deck Deck) int {
	return MaxPlayersForCardCount(len(deck.Cards()))
}

func MaxPlayersForCardCount(cardCount int) int {
	if cardCount <= 0 {
		return 0
	}

	return cardCount / MinCardsPerPlayer
}

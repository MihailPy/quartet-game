package game

func CheckCompletedQuartets(state *GameState, playerID PlayerID) []QuartetID {
	completed := []QuartetID{}

	hand := state.Hands[playerID]
	grouped := make(map[QuartetID][]Card)

	for _, card := range hand {
		grouped[card.QuartetID] = append(grouped[card.QuartetID], card)
	}

	for quartetID, cards := range grouped {
		if len(cards) == 4 {
			completed = append(completed, quartetID)
			state.Completed[playerID] = append(state.Completed[playerID], quartetID)
			removeCardsFromHand(state, playerID, cards)
		}
	}

	return completed
}

func CheckAllCompletedQuartets(state *GameState) []QuartetID {
	completed := []QuartetID{}

	for _, player := range state.Players {
		playerCompleted := CheckCompletedQuartets(state, player.ID)
		completed = append(completed, playerCompleted...)
	}

	return completed
}

func removeCardsFromHand(state *GameState, playerID PlayerID, cardsToRemove []Card) {
	removeMap := make(map[CardID]bool)

	for _, card := range cardsToRemove {
		removeMap[card.ID] = true
	}

	newHand := []Card{}

	for _, card := range state.Hands[playerID] {
		if !removeMap[card.ID] {
			newHand = append(newHand, card)
		}
	}

	state.Hands[playerID] = newHand
}

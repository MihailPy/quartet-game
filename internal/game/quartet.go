package game

import "errors"

func CheckCompletedQuartets(state *GameState, playerID PlayerID) []QuartetID {
	completed := []QuartetID{}

	hand := state.Hands[playerID]
	grouped := make(map[QuartetID][]Card)

	for _, card := range hand {
		grouped[card.QuartetID] = append(grouped[card.QuartetID], card)
	}

	for quartetID, cards := range grouped {
		if len(cards) == 4 {
			err := CompleteQuartet(state, playerID, quartetID)
			if err != nil {
				continue
			}

			completed = append(completed, quartetID)
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

var ErrPlayerHasNoCardFromQuartet = errors.New("player has no card from quartet")

func EnsurePlayerHasCardFromQuartet(state *GameState, playerID PlayerID, quartetID QuartetID) error {
	if state == nil {
		return ErrPlayerHasNoCardFromQuartet
	}

	if playerID == "" {
		return ErrPlayerHasNoCardFromQuartet
	}

	if quartetID == "" {
		return ErrPlayerHasNoCardFromQuartet
	}

	for _, card := range state.Hands[playerID] {
		if card.QuartetID == quartetID {
			return nil
		}
	}

	return ErrPlayerHasNoCardFromQuartet
}

var ErrCannotCompleteQuartet = errors.New("cannot complete quartet")

func CompleteQuartet(state *GameState, playerID PlayerID, quartetID QuartetID) error {
	if state == nil {
		return ErrCannotCompleteQuartet
	}

	if playerID == "" || quartetID == "" {
		return ErrCannotCompleteQuartet
	}

	cards := []Card{}

	for _, card := range state.Hands[playerID] {
		if card.QuartetID == quartetID {
			cards = append(cards, card)
		}
	}

	if len(cards) != 4 {
		return ErrCannotCompleteQuartet
	}

	state.Completed[playerID] = append(state.Completed[playerID], quartetID)
	removeCardsFromHand(state, playerID, cards)

	return nil
}

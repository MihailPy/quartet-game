package game

import "errors"

var ErrCardNotInPlayerHand = errors.New("card not in player hand")

func PlayerHasCard(state *GameState, playerID PlayerID, cardID CardID) bool {
	if state == nil {
		return false
	}

	if playerID == "" || cardID == "" {
		return false
	}

	for _, card := range state.Hands[playerID] {
		if card.ID == cardID {
			return true
		}
	}

	return false
}

func EnsurePlayerHasCard(state *GameState, playerID PlayerID, cardID CardID) error {
	if !PlayerHasCard(state, playerID, cardID) {
		return ErrCardNotInPlayerHand
	}

	return nil
}

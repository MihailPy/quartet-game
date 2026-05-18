package game

import "errors"

var ErrCannotDealCards = errors.New("cannot deal cards")

func DealCards(state *GameState, cards []Card) error {
	if state == nil {
		return ErrCannotDealCards
	}

	if len(state.Players) == 0 {
		return ErrCannotDealCards
	}

	if len(cards) == 0 {
		return ErrCannotDealCards
	}

	for _, player := range state.Players {
		state.Hands[player.ID] = []Card{}
	}

	for i, card := range cards {
		player := state.Players[i%len(state.Players)]
		state.Hands[player.ID] = append(state.Hands[player.ID], card)
	}

	return nil
}

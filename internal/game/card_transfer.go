package game

import "errors"

var ErrCannotTransferCard = errors.New("cannot transfer card")

func TransferCard(state *GameState, fromPlayerID PlayerID, toPlayerID PlayerID, cardID CardID) error {
	if state == nil {
		return ErrCannotTransferCard
	}

	if fromPlayerID == "" || toPlayerID == "" || cardID == "" {
		return ErrCannotTransferCard
	}

	card, found := removeCardFromPlayerHand(state, fromPlayerID, cardID)
	if !found {
		return ErrCannotTransferCard
	}

	state.Hands[toPlayerID] = append(state.Hands[toPlayerID], card)

	return nil
}

func removeCardFromPlayerHand(state *GameState, playerID PlayerID, cardID CardID) (Card, bool) {
	hand := state.Hands[playerID]

	for i, card := range hand {
		if card.ID == cardID {
			state.Hands[playerID] = append(hand[:i], hand[i+1:]...)
			return card, true
		}
	}

	return Card{}, false
}

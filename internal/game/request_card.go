package game

import "errors"

var ErrCannotRequestCard = errors.New("cannot request card")
var ErrTargetPlayerHasNoCards = errors.New("target player has no cards")
var ErrGameAlreadyFinished = errors.New("game already finished")

type RequestCardResult struct {
	Success           bool
	RequestedCard     Card
	CompletedQuartets []QuartetID
	NextPlayerID      PlayerID
}

func RequestCard(state *GameState, command RequestCardCommand) (RequestCardResult, error) {
	if state == nil {
		return RequestCardResult{}, ErrCannotRequestCard
	}

	if state.Status == GameStatusFinished {
		return RequestCardResult{}, ErrGameAlreadyFinished
	}

	if state.Status != GameStatusPlaying {
		return RequestCardResult{}, ErrCannotRequestCard
	}

	if err := EnsurePlayerTurn(state, command.ActorID); err != nil {
		return RequestCardResult{}, err
	}

	requestedCard, err := state.Deck.FindCard(command.CardID)
	if err != nil {
		return RequestCardResult{}, err
	}

	if err := EnsurePlayerHasCardFromQuartet(state, command.ActorID, requestedCard.QuartetID); err != nil {
		return RequestCardResult{}, err
	}

	if !PlayerCanTakeTurn(state, command.TargetPlayerID) {
		return RequestCardResult{}, ErrTargetPlayerHasNoCards
	}

	if PlayerHasCard(state, command.TargetPlayerID, command.CardID) {
		if err := TransferCard(state, command.TargetPlayerID, command.ActorID, command.CardID); err != nil {
			return RequestCardResult{}, err
		}

		completed := CheckCompletedQuartets(state, command.ActorID)

		FinishGame(state)

		nextPlayerID := command.ActorID

		if state.Status == GameStatusPlaying && !PlayerCanTakeTurn(state, command.ActorID) {
			foundNextPlayerID, ok := FindNextPlayerWhoCanTakeTurn(state, command.ActorID)
			if !ok {
				FinishGame(state)
			} else {
				nextPlayerID = foundNextPlayerID

				if err := ChangeTurnTo(state, nextPlayerID); err != nil {
					return RequestCardResult{}, err
				}
			}
		}

		return RequestCardResult{
			Success:           true,
			RequestedCard:     requestedCard,
			CompletedQuartets: completed,
			NextPlayerID:      nextPlayerID,
		}, nil
	}

	nextPlayerID, ok := FindNextPlayerWhoCanTakeTurn(state, command.ActorID)
	if !ok {
		FinishGame(state)

		return RequestCardResult{
			Success:       false,
			RequestedCard: requestedCard,
			NextPlayerID:  "",
		}, nil
	}

	if err := ChangeTurnTo(state, nextPlayerID); err != nil {
		return RequestCardResult{}, err
	}

	return RequestCardResult{
		Success:       false,
		RequestedCard: requestedCard,
		NextPlayerID:  nextPlayerID,
	}, nil
}

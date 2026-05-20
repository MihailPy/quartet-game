package game

import "errors"

var ErrCannotRequestCard = errors.New("cannot request card")

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

	if PlayerHasCard(state, command.TargetPlayerID, command.CardID) {
		if err := TransferCard(state, command.TargetPlayerID, command.ActorID, command.CardID); err != nil {
			return RequestCardResult{}, err
		}

		completed := CheckCompletedQuartets(state, command.ActorID)

		FinishGame(state)

		return RequestCardResult{
			Success:           true,
			RequestedCard:     requestedCard,
			CompletedQuartets: completed,
			NextPlayerID:      command.ActorID,
		}, nil
	}

	if err := ChangeTurnTo(state, command.TargetPlayerID); err != nil {
		return RequestCardResult{}, err
	}

	return RequestCardResult{
		Success:       false,
		RequestedCard: requestedCard,
		NextPlayerID:  command.TargetPlayerID,
	}, nil
}

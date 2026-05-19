package game

import "errors"

var ErrInvalidRequestCardCommand = errors.New("invalid request card command")

type RequestCardCommand struct {
	ActorID        PlayerID
	TargetPlayerID PlayerID
	CardID         CardID
}

func NewRequestCardCommand(actorID PlayerID, targetPlayerID PlayerID, cardID CardID) (RequestCardCommand, error) {
	if actorID == "" {
		return RequestCardCommand{}, ErrInvalidRequestCardCommand
	}

	if targetPlayerID == "" {
		return RequestCardCommand{}, ErrInvalidRequestCardCommand
	}

	if cardID == "" {
		return RequestCardCommand{}, ErrInvalidRequestCardCommand
	}

	if actorID == targetPlayerID {
		return RequestCardCommand{}, ErrInvalidRequestCardCommand
	}

	return RequestCardCommand{
		ActorID:        actorID,
		TargetPlayerID: targetPlayerID,
		CardID:         cardID,
	}, nil
}

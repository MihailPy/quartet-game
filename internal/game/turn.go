package game

import "errors"

var ErrCannotChooseFirstPlayer = errors.New("cannot choose first player")

func ChooseFirstPlayer(state *GameState) error {
	if state == nil {
		return ErrCannotChooseFirstPlayer
	}

	if len(state.Players) == 0 {
		return ErrCannotChooseFirstPlayer
	}

	state.CurrentPlayerID = state.Players[0].ID

	return nil
}

var ErrNotPlayerTurn = errors.New("not player turn")

func EnsurePlayerTurn(state *GameState, playerID PlayerID) error {
	if state == nil {
		return ErrNotPlayerTurn
	}

	if playerID == "" {
		return ErrNotPlayerTurn
	}

	if state.CurrentPlayerID != playerID {
		return ErrNotPlayerTurn
	}

	return nil
}

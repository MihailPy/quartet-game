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

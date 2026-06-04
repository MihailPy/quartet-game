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

var ErrCannotChangeTurn = errors.New("cannot change turn")

func ChangeTurnTo(state *GameState, playerID PlayerID) error {
	if state == nil {
		return ErrCannotChangeTurn
	}

	if playerID == "" {
		return ErrCannotChangeTurn
	}

	if !PlayerExists(state, playerID) {
		return ErrCannotChangeTurn
	}

	state.CurrentPlayerID = playerID

	return nil
}

func PlayerCanTakeTurn(state *GameState, playerID PlayerID) bool {
	if state == nil {
		return false
	}

	if playerID == "" {
		return false
	}

	return len(state.Hands[playerID]) > 0
}

func FindNextPlayerWhoCanTakeTurn(state *GameState, currentPlayerID PlayerID) (PlayerID, bool) {
	if state == nil {
		return "", false
	}

	if len(state.Players) == 0 {
		return "", false
	}

	currentPlayerIndex := -1

	for index, player := range state.Players {
		if player.ID == currentPlayerID {
			currentPlayerIndex = index
			break
		}
	}

	if currentPlayerIndex == -1 {
		return "", false
	}

	for offset := 1; offset <= len(state.Players); offset++ {
		nextIndex := (currentPlayerIndex + offset) % len(state.Players)
		nextPlayerID := state.Players[nextIndex].ID

		if PlayerCanTakeTurn(state, nextPlayerID) {
			return nextPlayerID, true
		}
	}

	return "", false
}

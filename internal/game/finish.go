package game

func IsGameFinished(state *GameState) bool {
	if state == nil {
		return false
	}

	totalCompleted := 0

	for _, player := range state.Players {
		totalCompleted += len(state.Completed[player.ID])
	}

	return totalCompleted == len(state.Deck.Quartets)
}

func FinishGame(state *GameState) {
	if state == nil {
		return
	}

	if IsGameFinished(state) {
		state.Status = GameStatusFinished
	}
}

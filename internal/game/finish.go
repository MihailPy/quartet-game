package game

func IsGameFinished(state *GameState) bool {
	if state == nil {
		return false
	}

	return AreAllQuartetsCompleted(state) || NobodyCanTakeTurn(state)
}

func AreAllQuartetsCompleted(state *GameState) bool {
	totalCompleted := 0

	for _, player := range state.Players {
		totalCompleted += len(state.Completed[player.ID])
	}

	return totalCompleted == len(state.Deck.Quartets)
}

func NobodyCanTakeTurn(state *GameState) bool {
	for _, player := range state.Players {
		if PlayerCanTakeTurn(state, player.ID) {
			return false
		}
	}

	return true
}

func FinishGame(state *GameState) {
	if state == nil {
		return
	}

	if IsGameFinished(state) {
		state.Status = GameStatusFinished
	}
}

package game

func PlayerExists(state *GameState, playerID PlayerID) bool {
	if state == nil {
		return false
	}

	if playerID == "" {
		return false
	}

	for _, player := range state.Players {
		if player.ID == playerID {
			return true
		}
	}

	return false
}

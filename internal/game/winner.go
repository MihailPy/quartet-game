package game

type GameResult struct {
	Winners []PlayerID
	Scores  map[PlayerID]int
}

func CalculateGameResult(state *GameState) GameResult {
	result := GameResult{
		Winners: []PlayerID{},
		Scores:  make(map[PlayerID]int),
	}

	if state == nil {
		return result
	}

	maxScore := 0

	for _, player := range state.Players {
		score := len(state.Completed[player.ID])
		result.Scores[player.ID] = score

		if score > maxScore {
			maxScore = score
			result.Winners = []PlayerID{player.ID}
			continue
		}

		if score == maxScore {
			result.Winners = append(result.Winners, player.ID)
		}
	}

	return result
}

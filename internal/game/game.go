package game

func NewGame(id GameID, deck Deck, players []Player) (GameState, error) {
	state, err := NewGameState(id, deck, players)
	if err != nil {
		return GameState{}, err
	}

	return state, nil
}

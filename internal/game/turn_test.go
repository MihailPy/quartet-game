package game

import "testing"

func TestChooseFirstPlayer(t *testing.T) {
	deck := testDeck()

	players := testPlayers()

	state, err := NewGame("game_1", deck, players)
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}

	err = ChooseFirstPlayer(&state)
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}

	if state.CurrentPlayerID != "player_1" {
		t.Fatalf("expected current player player_1, got %s", state.CurrentPlayerID)
	}
}

func TestChooseFirstPlayerInvalid(t *testing.T) {
	err := ChooseFirstPlayer(nil)
	if err == nil {
		t.Fatal("expected error, got nil")
	}
}

func TestEnsurePlayerTurn(t *testing.T) {
	deck := testDeck()

	players := testPlayers()

	state, err := NewGame("game_1", deck, players)
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}

	state.CurrentPlayerID = "player_1"

	err = EnsurePlayerTurn(&state, "player_1")
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}
}

func TestEnsurePlayerTurnInvalid(t *testing.T) {
	deck := testDeck()

	players := testPlayers()

	state, err := NewGame("game_1", deck, players)
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}

	state.CurrentPlayerID = "player_1"

	tests := []struct {
		name     string
		state    *GameState
		playerID PlayerID
	}{
		{
			name:     "nil state",
			state:    nil,
			playerID: "player_1",
		},
		{
			name:     "empty player id",
			state:    &state,
			playerID: "",
		},
		{
			name:     "wrong player turn",
			state:    &state,
			playerID: "player_2",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := EnsurePlayerTurn(tt.state, tt.playerID)
			if err == nil {
				t.Fatal("expected error, got nil")
			}
		})
	}
}

func TestChangeTurnTo(t *testing.T) {
	deck := testDeck()

	players := testPlayers()

	state, err := NewGame("game_1", deck, players)
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}

	state.CurrentPlayerID = "player_1"

	err = ChangeTurnTo(&state, "player_2")
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}

	if state.CurrentPlayerID != "player_2" {
		t.Fatalf("expected current player player_2, got %s", state.CurrentPlayerID)
	}
}

func TestChangeTurnToInvalid(t *testing.T) {
	deck := testDeck()

	players := testPlayers()

	state, err := NewGame("game_1", deck, players)
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}

	tests := []struct {
		name     string
		state    *GameState
		playerID PlayerID
	}{
		{
			name:     "nil state",
			state:    nil,
			playerID: "player_1",
		},
		{
			name:     "empty player id",
			state:    &state,
			playerID: "",
		},
		{
			name:     "unknown player",
			state:    &state,
			playerID: "unknown_player",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := ChangeTurnTo(tt.state, tt.playerID)
			if err == nil {
				t.Fatal("expected error, got nil")
			}
		})
	}
}

func TestPlayerCanTakeTurnReturnsTrueWhenPlayerHasCards(t *testing.T) {
	deck := testDeck()
	players := testPlayers()

	state, err := NewGame("game_1", deck, players)
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}

	state.Hands["player_1"] = []Card{
		{ID: "card_1", QuartetID: "quartet_1", Title: "Boeing 747"},
	}

	if !PlayerCanTakeTurn(&state, "player_1") {
		t.Fatal("expected player_1 to be able to take turn")
	}
}

func TestPlayerCanTakeTurnReturnsFalseWhenPlayerHasNoCards(t *testing.T) {
	deck := testDeck()
	players := testPlayers()

	state, err := NewGame("game_1", deck, players)
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}

	state.Hands["player_1"] = []Card{}

	if PlayerCanTakeTurn(&state, "player_1") {
		t.Fatal("expected player_1 to be unable to take turn")
	}
}

func TestPlayerCanTakeTurnReturnsFalseForUnknownPlayer(t *testing.T) {
	deck := testDeck()
	players := testPlayers()

	state, err := NewGame("game_1", deck, players)
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}

	if PlayerCanTakeTurn(&state, "unknown_player") {
		t.Fatal("expected unknown player to be unable to take turn")
	}
}

func TestFindNextPlayerWhoCanTakeTurnReturnsNextPlayerWithCards(t *testing.T) {
	deck := testDeck()
	players := testPlayers()

	state, err := NewGame("game_1", deck, players)
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}

	state.Hands["player_1"] = []Card{}
	state.Hands["player_2"] = []Card{
		{ID: "card_5", QuartetID: "quartet_2", Title: "Другая карта"},
	}

	nextPlayerID, ok := FindNextPlayerWhoCanTakeTurn(&state, "player_1")
	if !ok {
		t.Fatal("expected next player to be found")
	}

	if nextPlayerID != "player_2" {
		t.Fatalf("expected next player to be player_2, got %s", nextPlayerID)
	}
}

func TestFindNextPlayerWhoCanTakeTurnSkipsPlayersWithoutCards(t *testing.T) {
	deck := testDeck()
	players := testPlayers()

	state, err := NewGame("game_1", deck, players)
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}

	state.Players = append(state.Players, Player{ID: "player_3", Name: "Player 3"})

	state.Hands["player_1"] = []Card{
		{ID: "card_1", QuartetID: "quartet_1", Title: "Boeing 747"},
	}
	state.Hands["player_2"] = []Card{}
	state.Hands["player_3"] = []Card{
		{ID: "card_5", QuartetID: "quartet_2", Title: "Другая карта"},
	}

	nextPlayerID, ok := FindNextPlayerWhoCanTakeTurn(&state, "player_1")
	if !ok {
		t.Fatal("expected next player to be found")
	}

	if nextPlayerID != "player_3" {
		t.Fatalf("expected next player to be player_3, got %s", nextPlayerID)
	}
}

func TestFindNextPlayerWhoCanTakeTurnReturnsFalseWhenNobodyCanMove(t *testing.T) {
	deck := testDeck()
	players := testPlayers()

	state, err := NewGame("game_1", deck, players)
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}

	state.Hands["player_1"] = []Card{}
	state.Hands["player_2"] = []Card{}

	_, ok := FindNextPlayerWhoCanTakeTurn(&state, "player_1")
	if ok {
		t.Fatal("expected no next player to be found")
	}
}

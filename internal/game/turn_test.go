package game

import "testing"

func TestChooseFirstPlayer(t *testing.T) {
	deck := testDeck()

	players := []Player{
		{ID: "player_1", Name: "Mihail"},
		{ID: "player_2", Name: "Anna"},
	}

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

	players := []Player{
		{ID: "player_1", Name: "Mihail"},
		{ID: "player_2", Name: "Anna"},
	}

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

	players := []Player{
		{ID: "player_1", Name: "Mihail"},
		{ID: "player_2", Name: "Anna"},
	}

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

	players := []Player{
		{ID: "player_1", Name: "Mihail"},
		{ID: "player_2", Name: "Anna"},
	}

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

	players := []Player{
		{ID: "player_1", Name: "Mihail"},
		{ID: "player_2", Name: "Anna"},
	}

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

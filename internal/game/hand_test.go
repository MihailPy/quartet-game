package game

import "testing"

func TestPlayerHasCard(t *testing.T) {
	deck := testDeck()

	players := testPlayers()

	state, err := NewGame("game_1", deck, players)
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}

	state.Hands["player_1"] = []Card{
		{ID: "card_1", QuartetID: "quartet_1", Title: "Boeing 747"},
	}

	if !PlayerHasCard(&state, "player_1", "card_1") {
		t.Fatal("expected player_1 to have card_1")
	}

	if PlayerHasCard(&state, "player_1", "card_2") {
		t.Fatal("expected player_1 not to have card_2")
	}
}

func TestEnsurePlayerHasCard(t *testing.T) {
	deck := testDeck()

	players := testPlayers()

	state, err := NewGame("game_1", deck, players)
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}

	state.Hands["player_1"] = []Card{
		{ID: "card_1", QuartetID: "quartet_1", Title: "Boeing 747"},
	}

	err = EnsurePlayerHasCard(&state, "player_1", "card_1")
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}
}

func TestEnsurePlayerHasCardInvalid(t *testing.T) {
	deck := testDeck()

	players := testPlayers()

	state, err := NewGame("game_1", deck, players)
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}

	state.Hands["player_1"] = []Card{
		{ID: "card_1", QuartetID: "quartet_1", Title: "Boeing 747"},
	}

	tests := []struct {
		name     string
		state    *GameState
		playerID PlayerID
		cardID   CardID
	}{
		{
			name:     "nil state",
			state:    nil,
			playerID: "player_1",
			cardID:   "card_1",
		},
		{
			name:     "empty player id",
			state:    &state,
			playerID: "",
			cardID:   "card_1",
		},
		{
			name:     "empty card id",
			state:    &state,
			playerID: "player_1",
			cardID:   "",
		},
		{
			name:     "card not in hand",
			state:    &state,
			playerID: "player_1",
			cardID:   "card_2",
		},
		{
			name:     "unknown player",
			state:    &state,
			playerID: "unknown_player",
			cardID:   "card_1",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := EnsurePlayerHasCard(tt.state, tt.playerID, tt.cardID)
			if err == nil {
				t.Fatal("expected error, got nil")
			}
		})
	}
}

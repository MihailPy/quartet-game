package game

import "testing"

func TestTransferCard(t *testing.T) {
	deck := testDeck()

	players := []Player{
		{ID: "player_1", Name: "Mihail"},
		{ID: "player_2", Name: "Anna"},
	}

	state, err := NewGame("game_1", deck, players)
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}

	state.Hands["player_1"] = []Card{}
	state.Hands["player_2"] = []Card{
		{ID: "card_1", QuartetID: "quartet_1", Title: "Boeing 747"},
	}

	err = TransferCard(&state, "player_2", "player_1", "card_1")
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}

	if len(state.Hands["player_2"]) != 0 {
		t.Fatalf("expected player_2 to have 0 cards, got %d", len(state.Hands["player_2"]))
	}

	if len(state.Hands["player_1"]) != 1 {
		t.Fatalf("expected player_1 to have 1 card, got %d", len(state.Hands["player_1"]))
	}

	if state.Hands["player_1"][0].ID != "card_1" {
		t.Fatalf("expected player_1 to receive card_1, got %s", state.Hands["player_1"][0].ID)
	}
}

func TestTransferCardInvalid(t *testing.T) {
	deck := testDeck()

	players := []Player{
		{ID: "player_1", Name: "Mihail"},
		{ID: "player_2", Name: "Anna"},
	}

	state, err := NewGame("game_1", deck, players)
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}

	state.Hands["player_2"] = []Card{
		{ID: "card_1", QuartetID: "quartet_1", Title: "Boeing 747"},
	}

	tests := []struct {
		name         string
		state        *GameState
		fromPlayerID PlayerID
		toPlayerID   PlayerID
		cardID       CardID
	}{
		{
			name:         "nil state",
			state:        nil,
			fromPlayerID: "player_2",
			toPlayerID:   "player_1",
			cardID:       "card_1",
		},
		{
			name:         "empty from player id",
			state:        &state,
			fromPlayerID: "",
			toPlayerID:   "player_1",
			cardID:       "card_1",
		},
		{
			name:         "empty to player id",
			state:        &state,
			fromPlayerID: "player_2",
			toPlayerID:   "",
			cardID:       "card_1",
		},
		{
			name:         "empty card id",
			state:        &state,
			fromPlayerID: "player_2",
			toPlayerID:   "player_1",
			cardID:       "",
		},
		{
			name:         "card not found in source hand",
			state:        &state,
			fromPlayerID: "player_2",
			toPlayerID:   "player_1",
			cardID:       "unknown_card",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := TransferCard(tt.state, tt.fromPlayerID, tt.toPlayerID, tt.cardID)
			if err == nil {
				t.Fatal("expected error, got nil")
			}
		})
	}
}

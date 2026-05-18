package game

import "testing"

func TestNewGame(t *testing.T) {
	deck := testDeck()

	players := []Player{
		{ID: "player_1", Name: "Mihail"},
		{ID: "player_2", Name: "Anna"},
	}

	state, err := NewGame("game_1", deck, players)
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}

	if state.ID != "game_1" {
		t.Fatalf("expected game ID game_1, got %s", state.ID)
	}

	if state.Status != GameStatusWaiting {
		t.Fatalf("expected status waiting, got %s", state.Status)
	}

	if len(state.Players) != 2 {
		t.Fatalf("expected 2 players, got %d", len(state.Players))
	}
}

func TestNewGameInvalid(t *testing.T) {
	deck := testDeck()

	players := []Player{
		{ID: "player_1", Name: "Mihail"},
	}

	_, err := NewGame("game_1", deck, players)
	if err == nil {
		t.Fatal("expected error, got nil")
	}
}

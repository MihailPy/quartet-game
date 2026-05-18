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

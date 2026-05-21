package game

import "testing"

func TestPlayerExists(t *testing.T) {
	deck := testDeck()

	players := testPlayers()

	state, err := NewGame("game_1", deck, players)
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}

	if !PlayerExists(&state, "player_1") {
		t.Fatal("expected player_1 to exist")
	}

	if PlayerExists(&state, "unknown_player") {
		t.Fatal("expected unknown_player not to exist")
	}
}

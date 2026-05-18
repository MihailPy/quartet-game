package game

import "testing"

func TestCheckCompletedQuartets(t *testing.T) {
	deck := testDeck()

	players := []Player{
		{ID: "player_1", Name: "Mihail"},
		{ID: "player_2", Name: "Anna"},
	}

	state, err := NewGame("game_1", deck, players)
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}

	state.Hands["player_1"] = deck.Cards()

	completed := CheckCompletedQuartets(&state, "player_1")

	if len(completed) != 1 {
		t.Fatalf("expected 1 completed quartet, got %d", len(completed))
	}

	if completed[0] != "quartet_1" {
		t.Fatalf("expected completed quartet quartet_1, got %s", completed[0])
	}

	if len(state.Completed["player_1"]) != 1 {
		t.Fatalf("expected player_1 to have 1 completed quartet, got %d", len(state.Completed["player_1"]))
	}

	if len(state.Hands["player_1"]) != 0 {
		t.Fatalf("expected player_1 hand to be empty, got %d cards", len(state.Hands["player_1"]))
	}
}

func TestCheckCompletedQuartetsNoQuartet(t *testing.T) {
	deck := testDeck()

	players := []Player{
		{ID: "player_1", Name: "Mihail"},
		{ID: "player_2", Name: "Anna"},
	}

	state, err := NewGame("game_1", deck, players)
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}

	state.Hands["player_1"] = deck.Cards()[:3]

	completed := CheckCompletedQuartets(&state, "player_1")

	if len(completed) != 0 {
		t.Fatalf("expected 0 completed quartets, got %d", len(completed))
	}

	if len(state.Completed["player_1"]) != 0 {
		t.Fatalf("expected player_1 to have 0 completed quartets, got %d", len(state.Completed["player_1"]))
	}

	if len(state.Hands["player_1"]) != 3 {
		t.Fatalf("expected player_1 hand to have 3 cards, got %d", len(state.Hands["player_1"]))
	}
}

func TestCheckAllCompletedQuartets(t *testing.T) {
	deck := testDeck()

	players := []Player{
		{ID: "player_1", Name: "Mihail"},
		{ID: "player_2", Name: "Anna"},
	}

	state, err := NewGame("game_1", deck, players)
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}

	state.Hands["player_1"] = deck.Cards()

	completed := CheckAllCompletedQuartets(&state)

	if len(completed) != 1 {
		t.Fatalf("expected 1 completed quartet, got %d", len(completed))
	}

	if len(state.Completed["player_1"]) != 1 {
		t.Fatalf("expected player_1 to have 1 completed quartet, got %d", len(state.Completed["player_1"]))
	}
}

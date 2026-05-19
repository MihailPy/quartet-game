package game

import "testing"

func TestIsGameFinished(t *testing.T) {
	deck := testDeck()

	players := []Player{
		{ID: "player_1", Name: "Mihail"},
		{ID: "player_2", Name: "Anna"},
	}

	state, err := NewGame("game_1", deck, players)
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}

	state.Completed["player_1"] = []QuartetID{"quartet_1"}

	if !IsGameFinished(&state) {
		t.Fatal("expected game to be finished")
	}
}

func TestIsGameFinishedFalse(t *testing.T) {
	deck := testDeck()

	players := []Player{
		{ID: "player_1", Name: "Mihail"},
		{ID: "player_2", Name: "Anna"},
	}

	state, err := NewGame("game_1", deck, players)
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}

	if IsGameFinished(&state) {
		t.Fatal("expected game not to be finished")
	}
}

func TestFinishGame(t *testing.T) {
	deck := testDeck()

	players := []Player{
		{ID: "player_1", Name: "Mihail"},
		{ID: "player_2", Name: "Anna"},
	}

	state, err := NewGame("game_1", deck, players)
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}

	state.Status = GameStatusPlaying
	state.Completed["player_1"] = []QuartetID{"quartet_1"}

	FinishGame(&state)

	if state.Status != GameStatusFinished {
		t.Fatalf("expected status finished, got %s", state.Status)
	}
}

func TestFinishGameDoesNothingWhenNotFinished(t *testing.T) {
	deck := testDeck()

	players := []Player{
		{ID: "player_1", Name: "Mihail"},
		{ID: "player_2", Name: "Anna"},
	}

	state, err := NewGame("game_1", deck, players)
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}

	state.Status = GameStatusPlaying

	FinishGame(&state)

	if state.Status != GameStatusPlaying {
		t.Fatalf("expected status playing, got %s", state.Status)
	}
}

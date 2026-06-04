package game

import "testing"

func TestIsGameFinished(t *testing.T) {
	deck := testDeck()

	players := testPlayers()

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

	players := testPlayers()

	state, err := NewGame("game_1", deck, players)
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}

	state.Hands["player_1"] = []Card{
		{ID: "card_1", QuartetID: "quartet_1", Title: "Boeing 747"},
	}

	if IsGameFinished(&state) {
		t.Fatal("expected game not to be finished")
	}
}

func TestFinishGame(t *testing.T) {
	deck := testDeck()

	players := testPlayers()

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

	players := testPlayers()

	state, err := NewGame("game_1", deck, players)
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}

	state.Status = GameStatusPlaying
	state.Hands["player_1"] = []Card{
		{ID: "card_1", QuartetID: "quartet_1", Title: "Boeing 747"},
	}

	FinishGame(&state)

	if state.Status != GameStatusPlaying {
		t.Fatalf("expected status playing, got %s", state.Status)
	}
}

func TestIsGameFinishedWhenNobodyCanTakeTurn(t *testing.T) {
	deck := testDeck()

	players := testPlayers()

	state, err := NewGame("game_1", deck, players)
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}

	state.Hands["player_1"] = []Card{}
	state.Hands["player_2"] = []Card{}

	if !IsGameFinished(&state) {
		t.Fatal("expected game to be finished when nobody can take turn")
	}
}

func TestFinishGameWhenNobodyCanTakeTurn(t *testing.T) {
	deck := testDeck()

	players := testPlayers()

	state, err := NewGame("game_1", deck, players)
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}

	state.Status = GameStatusPlaying
	state.Hands["player_1"] = []Card{}
	state.Hands["player_2"] = []Card{}

	FinishGame(&state)

	if state.Status != GameStatusFinished {
		t.Fatalf("expected status finished, got %s", state.Status)
	}
}

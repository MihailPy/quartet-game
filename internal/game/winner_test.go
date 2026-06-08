package game

import "testing"

func TestCalculateGameResultSingleWinner(t *testing.T) {
	deck := testDeck()

	players := testPlayers()

	state, err := NewGame("game_1", deck, players)
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}

	state.Completed["player_1"] = []QuartetID{"quartet_1"}
	state.Completed["player_2"] = []QuartetID{}

	result := CalculateGameResult(&state)

	if len(result.Winners) != 1 {
		t.Fatalf("expected 1 winner, got %d", len(result.Winners))
	}

	if result.Winners[0] != "player_1" {
		t.Fatalf("expected winner player_1, got %s", result.Winners[0])
	}

	if result.Scores["player_1"] != 1 {
		t.Fatalf("expected player_1 score 1, got %d", result.Scores["player_1"])
	}

	if result.Scores["player_2"] != 0 {
		t.Fatalf("expected player_2 score 0, got %d", result.Scores["player_2"])
	}
}

func TestCalculateGameResultTie(t *testing.T) {
	deck := testDeck()

	players := testPlayers()

	state, err := NewGame("game_1", deck, players)
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}

	state.Completed["player_1"] = []QuartetID{"quartet_1"}
	state.Completed["player_2"] = []QuartetID{"quartet_2"}

	result := CalculateGameResult(&state)

	if len(result.Winners) != 2 {
		t.Fatalf("expected 2 winners, got %d", len(result.Winners))
	}

	expectedWinners := map[PlayerID]bool{
		"player_1": true,
		"player_2": true,
	}

	for _, winnerID := range result.Winners {
		if !expectedWinners[winnerID] {
			t.Fatalf("unexpected winner %s", winnerID)
		}
	}

	if result.Scores["player_1"] != 1 {
		t.Fatalf("expected player_1 score 1, got %d", result.Scores["player_1"])
	}

	if result.Scores["player_2"] != 1 {
		t.Fatalf("expected player_2 score 1, got %d", result.Scores["player_2"])
	}
}

func TestCalculateGameResultNilState(t *testing.T) {
	result := CalculateGameResult(nil)

	if len(result.Winners) != 0 {
		t.Fatalf("expected 0 winners, got %d", len(result.Winners))
	}

	if len(result.Scores) != 0 {
		t.Fatalf("expected 0 scores, got %d", len(result.Scores))
	}
}

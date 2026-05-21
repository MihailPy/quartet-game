package game

import "testing"

func TestCheckCompletedQuartets(t *testing.T) {
	deck := testDeck()

	players := testPlayers()

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

	players := testPlayers()

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

	players := testPlayers()

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

func TestEnsurePlayerHasCardFromQuartet(t *testing.T) {
	deck := testDeck()

	players := testPlayers()

	state, err := NewGame("game_1", deck, players)
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}

	state.Hands["player_1"] = []Card{
		{ID: "card_1", QuartetID: "quartet_1", Title: "Boeing 747"},
	}

	err = EnsurePlayerHasCardFromQuartet(&state, "player_1", "quartet_1")
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}
}

func TestEnsurePlayerHasCardFromQuartetInvalid(t *testing.T) {
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
		name      string
		state     *GameState
		playerID  PlayerID
		quartetID QuartetID
	}{
		{
			name:      "nil state",
			state:     nil,
			playerID:  "player_1",
			quartetID: "quartet_1",
		},
		{
			name:      "empty player id",
			state:     &state,
			playerID:  "",
			quartetID: "quartet_1",
		},
		{
			name:      "empty quartet id",
			state:     &state,
			playerID:  "player_1",
			quartetID: "",
		},
		{
			name:      "player has no card from quartet",
			state:     &state,
			playerID:  "player_1",
			quartetID: "quartet_2",
		},
		{
			name:      "unknown player",
			state:     &state,
			playerID:  "unknown_player",
			quartetID: "quartet_1",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := EnsurePlayerHasCardFromQuartet(tt.state, tt.playerID, tt.quartetID)
			if err == nil {
				t.Fatal("expected error, got nil")
			}
		})
	}
}

func TestCheckCompletedQuartetsAfterReceivingFourthCard(t *testing.T) {
	deck := testDeck()

	players := testPlayers()

	state, err := NewGame("game_1", deck, players)
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}

	state.Hands["player_1"] = []Card{
		{ID: "card_1", QuartetID: "quartet_1", Title: "Boeing 747"},
		{ID: "card_2", QuartetID: "quartet_1", Title: "Airbus A380"},
		{ID: "card_3", QuartetID: "quartet_1", Title: "Concorde"},
	}

	state.Hands["player_2"] = []Card{
		{ID: "card_4", QuartetID: "quartet_1", Title: "Ан-225"},
	}

	err = TransferCard(&state, "player_2", "player_1", "card_4")
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}

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

	if state.Completed["player_1"][0] != "quartet_1" {
		t.Fatalf("expected completed quartet quartet_1, got %s", state.Completed["player_1"][0])
	}

	if len(state.Hands["player_1"]) != 0 {
		t.Fatalf("expected player_1 hand to be empty after completing quartet, got %d cards", len(state.Hands["player_1"]))
	}

	if len(state.Hands["player_2"]) != 0 {
		t.Fatalf("expected player_2 hand to be empty after transfer, got %d cards", len(state.Hands["player_2"]))
	}
}

func TestCompleteQuartet(t *testing.T) {
	deck := testDeck()

	players := testPlayers()

	state, err := NewGame("game_1", deck, players)
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}

	state.Hands["player_1"] = deck.Cards()

	err = CompleteQuartet(&state, "player_1", "quartet_1")
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}

	if len(state.Completed["player_1"]) != 1 {
		t.Fatalf("expected 1 completed quartet, got %d", len(state.Completed["player_1"]))
	}

	if state.Completed["player_1"][0] != "quartet_1" {
		t.Fatalf("expected quartet_1, got %s", state.Completed["player_1"][0])
	}

	if len(state.Hands["player_1"]) != 0 {
		t.Fatalf("expected empty hand, got %d cards", len(state.Hands["player_1"]))
	}
}

func TestCompleteQuartetInvalid(t *testing.T) {
	deck := testDeck()

	players := testPlayers()

	state, err := NewGame("game_1", deck, players)
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}

	state.Hands["player_1"] = deck.Cards()[:3]

	tests := []struct {
		name      string
		state     *GameState
		playerID  PlayerID
		quartetID QuartetID
	}{
		{
			name:      "nil state",
			state:     nil,
			playerID:  "player_1",
			quartetID: "quartet_1",
		},
		{
			name:      "empty player id",
			state:     &state,
			playerID:  "",
			quartetID: "quartet_1",
		},
		{
			name:      "empty quartet id",
			state:     &state,
			playerID:  "player_1",
			quartetID: "",
		},
		{
			name:      "not enough cards",
			state:     &state,
			playerID:  "player_1",
			quartetID: "quartet_1",
		},
		{
			name:      "unknown quartet",
			state:     &state,
			playerID:  "player_1",
			quartetID: "unknown_quartet",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := CompleteQuartet(tt.state, tt.playerID, tt.quartetID)
			if err == nil {
				t.Fatal("expected error, got nil")
			}
		})
	}
}

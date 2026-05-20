package game

import "testing"

func TestNewGameState(t *testing.T) {
	deck := testDeck()

	players := testPlayers()

	state, err := NewGameState("game_1", deck, players)
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

	if len(state.Hands) != 2 {
		t.Fatalf("expected hands for 2 players, got %d", len(state.Hands))
	}

	if len(state.Completed) != 2 {
		t.Fatalf("expected completed map for 2 players, got %d", len(state.Completed))
	}
}

func TestNewGameStateInvalid(t *testing.T) {
	deck := testDeck()

	players := testPlayers()

	tests := []struct {
		name    string
		id      GameID
		deck    Deck
		players []Player
	}{
		{
			name:    "empty game id",
			id:      "",
			deck:    deck,
			players: players,
		},
		{
			name:    "empty deck id",
			id:      "game_1",
			deck:    Deck{},
			players: players,
		},
		{
			name:    "less than two players",
			id:      "game_1",
			deck:    deck,
			players: []Player{{ID: "player_1", Name: "Mihail"}},
		},
		{
			name:    "player with empty id",
			id:      "game_1",
			deck:    deck,
			players: []Player{{ID: "", Name: "Mihail"}, {ID: "player_2", Name: "Anna"}},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			_, err := NewGameState(tt.id, tt.deck, tt.players)
			if err == nil {
				t.Fatal("expected error, got nil")
			}
		})
	}
}

func testDeck() Deck {
	cards := []Card{
		{ID: "card_1", QuartetID: "quartet_1", Title: "Boeing 747"},
		{ID: "card_2", QuartetID: "quartet_1", Title: "Airbus A380"},
		{ID: "card_3", QuartetID: "quartet_1", Title: "Concorde"},
		{ID: "card_4", QuartetID: "quartet_1", Title: "Ан-225"},
	}

	quartet := Quartet{
		ID:    "quartet_1",
		Title: "Самолёты",
		Cards: cards,
	}

	return Deck{
		ID:       "deck_1",
		Title:    "Транспорт",
		Quartets: []Quartet{quartet},
	}
}

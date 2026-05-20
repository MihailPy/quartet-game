package game

import "testing"

func TestDealCards(t *testing.T) {
	deck := testDeck()

	players := testPlayers()

	state, err := NewGame("game_1", deck, players)
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}

	err = DealCards(&state, deck.Cards())
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}

	if len(state.Hands["player_1"]) != 2 {
		t.Fatalf("expected player_1 to have 2 cards, got %d", len(state.Hands["player_1"]))
	}

	if len(state.Hands["player_2"]) != 2 {
		t.Fatalf("expected player_2 to have 2 cards, got %d", len(state.Hands["player_2"]))
	}
}

func TestDealCardsWithThreePlayers(t *testing.T) {
	deck := testDeck()

	players := testPlayers()
	players = append(players, Player{ID: "player_3", Name: "Bob"})

	state, err := NewGame("game_1", deck, players)
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}

	err = DealCards(&state, deck.Cards())
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}

	if len(state.Hands["player_1"]) != 2 {
		t.Fatalf("expected player_1 to have 2 cards, got %d", len(state.Hands["player_1"]))
	}

	if len(state.Hands["player_2"]) != 1 {
		t.Fatalf("expected player_2 to have 1 card, got %d", len(state.Hands["player_2"]))
	}

	if len(state.Hands["player_3"]) != 1 {
		t.Fatalf("expected player_3 to have 1 card, got %d", len(state.Hands["player_3"]))
	}
}

func TestDealCardsInvalid(t *testing.T) {
	err := DealCards(nil, testDeck().Cards())
	if err == nil {
		t.Fatal("expected error, got nil")
	}
}

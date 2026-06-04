package game

import "testing"

func TestRequestCardSuccess(t *testing.T) {
	deck := testDeck()
	players := testPlayers()

	state, err := NewGame("game_1", deck, players)
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}

	state.Status = GameStatusPlaying
	state.CurrentPlayerID = "player_1"

	state.Hands["player_1"] = []Card{
		{ID: "card_2", QuartetID: "quartet_1", Title: "Airbus A380"},
	}

	state.Hands["player_2"] = []Card{
		{ID: "card_1", QuartetID: "quartet_1", Title: "Boeing 747"},
	}

	command, err := NewRequestCardCommand("player_1", "player_2", "card_1")
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}

	result, err := RequestCard(&state, command)
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}

	if !result.Success {
		t.Fatal("expected request to be successful")
	}

	if result.RequestedCard.ID != "card_1" {
		t.Fatalf("expected requested card card_1, got %s", result.RequestedCard.ID)
	}

	if result.NextPlayerID != "player_1" {
		t.Fatalf("expected next player player_1, got %s", result.NextPlayerID)
	}

	if state.CurrentPlayerID != "player_1" {
		t.Fatalf("expected current player to remain player_1, got %s", state.CurrentPlayerID)
	}

	if !PlayerHasCard(&state, "player_1", "card_1") {
		t.Fatal("expected player_1 to receive card_1")
	}

	if PlayerHasCard(&state, "player_2", "card_1") {
		t.Fatal("expected player_2 to lose card_1")
	}
}

func TestRequestCardFailureChangesTurn(t *testing.T) {
	deck := testDeck()
	players := testPlayers()

	state, err := NewGame("game_1", deck, players)
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}

	state.Status = GameStatusPlaying
	state.CurrentPlayerID = "player_1"

	state.Hands["player_1"] = []Card{
		{ID: "card_2", QuartetID: "quartet_1", Title: "Airbus A380"},
	}

	state.Hands["player_2"] = []Card{
		{ID: "card_5", QuartetID: "quartet_2", Title: "Другая карта"},
	}

	command, err := NewRequestCardCommand("player_1", "player_2", "card_1")
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}

	result, err := RequestCard(&state, command)
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}

	if result.Success {
		t.Fatal("expected request to fail")
	}

	if result.RequestedCard.ID != "card_1" {
		t.Fatalf("expected requested card card_1, got %s", result.RequestedCard.ID)
	}

	if result.NextPlayerID != "player_2" {
		t.Fatalf("expected next player player_2, got %s", result.NextPlayerID)
	}

	if state.CurrentPlayerID != "player_2" {
		t.Fatalf("expected current player player_2, got %s", state.CurrentPlayerID)
	}

	if PlayerHasCard(&state, "player_1", "card_1") {
		t.Fatal("expected player_1 not to receive card_1")
	}

	if PlayerHasCard(&state, "player_2", "card_1") {
		t.Fatal("expected player_2 not to have card_1")
	}
}

func TestRequestCardInvalidWithoutQuartetCard(t *testing.T) {
	deck := testDeck()
	players := testPlayers()

	state, err := NewGame("game_1", deck, players)
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}

	state.Status = GameStatusPlaying
	state.CurrentPlayerID = "player_1"

	state.Hands["player_1"] = []Card{}
	state.Hands["player_2"] = []Card{
		{ID: "card_1", QuartetID: "quartet_1", Title: "Boeing 747"},
	}

	command, err := NewRequestCardCommand("player_1", "player_2", "card_1")
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}

	_, err = RequestCard(&state, command)
	if err == nil {
		t.Fatal("expected error, got nil")
	}

	if state.CurrentPlayerID != "player_1" {
		t.Fatalf("expected current player to stay player_1, got %s", state.CurrentPlayerID)
	}

	if !PlayerHasCard(&state, "player_2", "card_1") {
		t.Fatal("expected player_2 to keep card_1")
	}
}

func TestRequestCardCompletesQuartet(t *testing.T) {
	deck := testDeck()
	players := testPlayers()

	state, err := NewGame("game_1", deck, players)
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}

	state.Status = GameStatusPlaying
	state.CurrentPlayerID = "player_1"

	state.Hands["player_1"] = []Card{
		{ID: "card_1", QuartetID: "quartet_1", Title: "Boeing 747"},
		{ID: "card_2", QuartetID: "quartet_1", Title: "Airbus A380"},
		{ID: "card_3", QuartetID: "quartet_1", Title: "Concorde"},
	}

	state.Hands["player_2"] = []Card{
		{ID: "card_4", QuartetID: "quartet_1", Title: "Ан-225"},
	}

	command, err := NewRequestCardCommand("player_1", "player_2", "card_4")
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}

	result, err := RequestCard(&state, command)
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}

	if !result.Success {
		t.Fatal("expected request to be successful")
	}

	if len(result.CompletedQuartets) != 1 {
		t.Fatalf("expected 1 completed quartet, got %d", len(result.CompletedQuartets))
	}

	if result.CompletedQuartets[0] != "quartet_1" {
		t.Fatalf("expected completed quartet quartet_1, got %s", result.CompletedQuartets[0])
	}

	if len(state.Completed["player_1"]) != 1 {
		t.Fatalf("expected player_1 to have 1 completed quartet, got %d", len(state.Completed["player_1"]))
	}

	if state.Completed["player_1"][0] != "quartet_1" {
		t.Fatalf("expected player_1 completed quartet quartet_1, got %s", state.Completed["player_1"][0])
	}

	if len(state.Hands["player_1"]) != 0 {
		t.Fatalf("expected player_1 hand to be empty after completing quartet, got %d cards", len(state.Hands["player_1"]))
	}

	if len(state.Hands["player_2"]) != 0 {
		t.Fatalf("expected player_2 hand to be empty after giving card, got %d cards", len(state.Hands["player_2"]))
	}
}

func TestRequestCardFinishesGameAfterLastQuartet(t *testing.T) {
	deck := testDeck()
	players := testPlayers()

	state, err := NewGame("game_1", deck, players)
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}

	state.Status = GameStatusPlaying
	state.CurrentPlayerID = "player_1"

	state.Hands["player_1"] = []Card{
		{ID: "card_1", QuartetID: "quartet_1", Title: "Boeing 747"},
		{ID: "card_2", QuartetID: "quartet_1", Title: "Airbus A380"},
		{ID: "card_3", QuartetID: "quartet_1", Title: "Concorde"},
	}

	state.Hands["player_2"] = []Card{
		{ID: "card_4", QuartetID: "quartet_1", Title: "Ан-225"},
	}

	command, err := NewRequestCardCommand("player_1", "player_2", "card_4")
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}

	result, err := RequestCard(&state, command)
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}

	if !result.Success {
		t.Fatal("expected request to be successful")
	}

	if state.Status != GameStatusFinished {
		t.Fatalf("expected game status finished, got %s", state.Status)
	}
}

func TestRequestCardFailsWhenTargetPlayerHasNoCards(t *testing.T) {
	deck := testDeck()
	players := testPlayers()

	state, err := NewGame("game_1", deck, players)
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}

	state.Status = GameStatusPlaying
	state.CurrentPlayerID = "player_1"

	state.Hands["player_1"] = []Card{
		{ID: "card_2", QuartetID: "quartet_1", Title: "Airbus A380"},
	}

	state.Hands["player_2"] = []Card{}

	command, err := NewRequestCardCommand("player_1", "player_2", "card_1")
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}

	_, err = RequestCard(&state, command)
	if err != ErrTargetPlayerHasNoCards {
		t.Fatalf("expected ErrTargetPlayerHasNoCards, got %v", err)
	}

	if state.CurrentPlayerID != "player_1" {
		t.Fatalf("expected current player to stay player_1, got %s", state.CurrentPlayerID)
	}
}

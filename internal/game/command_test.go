package game

import "testing"

func TestNewRequestCardCommand(t *testing.T) {
	command, err := NewRequestCardCommand("player_1", "player_2", "card_1")
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}

	if command.ActorID != "player_1" {
		t.Fatalf("expected actor player_1, got %s", command.ActorID)
	}

	if command.TargetPlayerID != "player_2" {
		t.Fatalf("expected target player_2, got %s", command.TargetPlayerID)
	}

	if command.CardID != "card_1" {
		t.Fatalf("expected card card_1, got %s", command.CardID)
	}
}

func TestNewRequestCardCommandInvalid(t *testing.T) {
	tests := []struct {
		name           string
		actorID        PlayerID
		targetPlayerID PlayerID
		cardID         CardID
	}{
		{
			name:           "empty actor id",
			actorID:        "",
			targetPlayerID: "player_2",
			cardID:         "card_1",
		},
		{
			name:           "empty target player id",
			actorID:        "player_1",
			targetPlayerID: "",
			cardID:         "card_1",
		},
		{
			name:           "empty card id",
			actorID:        "player_1",
			targetPlayerID: "player_2",
			cardID:         "",
		},
		{
			name:           "actor equals target",
			actorID:        "player_1",
			targetPlayerID: "player_1",
			cardID:         "card_1",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			_, err := NewRequestCardCommand(tt.actorID, tt.targetPlayerID, tt.cardID)
			if err == nil {
				t.Fatal("expected error, got nil")
			}
		})
	}
}

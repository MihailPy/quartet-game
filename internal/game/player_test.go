package game

import "testing"

func TestNewPlayer(t *testing.T) {
	player, err := NewPlayer("player_1", "Mihail")
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}

	if player.ID != "player_1" {
		t.Fatalf("expected player ID player_1, got %s", player.ID)
	}

	if player.Name != "Mihail" {
		t.Fatalf("expected name Mihail, got %s", player.Name)
	}
}

func TestNewPlayerInvalid(t *testing.T) {
	tests := []struct {
		name       string
		playerID   PlayerID
		playerName string
	}{
		{
			name:       "empty id",
			playerID:   "",
			playerName: "Mihail",
		},
		{
			name:       "empty name",
			playerID:   "player_1",
			playerName: "",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			_, err := NewPlayer(tt.playerID, tt.playerName)
			if err == nil {
				t.Fatal("expected error, got nil")
			}
		})
	}
}

package room

import (
	"context"
	"testing"
)

func TestCreateRoomCreatesOwnerPlayer(t *testing.T) {
	manager := NewManager(nil)

	player, createdRoom, err := manager.CreateRoom(context.Background(), "Mihail")
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}

	if player.ID == "" {
		t.Fatal("expected player id to be set")
	}

	if player.Name != "Mihail" {
		t.Fatalf("expected player name Mihail, got %s", player.Name)
	}

	if createdRoom.OwnerPlayerID != player.ID {
		t.Fatalf(
			"expected owner player id %s, got %s",
			player.ID,
			createdRoom.OwnerPlayerID,
		)
	}

	if len(createdRoom.Players) != 1 {
		t.Fatalf("expected one player, got %d", len(createdRoom.Players))
	}

	if createdRoom.Players[0].ID != player.ID {
		t.Fatalf(
			"expected room player id %s, got %s",
			player.ID,
			createdRoom.Players[0].ID,
		)
	}
}

func TestJoinRoomDoesNotChangeOwner(t *testing.T) {
	manager := NewManager(nil)

	owner, createdRoom, err := manager.CreateRoom(context.Background(), "Mihail")
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}

	joinedPlayer, joinedRoom, err := manager.JoinRoom(
		context.Background(),
		createdRoom.ID,
		"Anna",
	)
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}

	if joinedPlayer.ID == owner.ID {
		t.Fatal("expected joined player to have different id")
	}

	if joinedRoom.OwnerPlayerID != owner.ID {
		t.Fatalf(
			"expected owner player id to stay %s, got %s",
			owner.ID,
			joinedRoom.OwnerPlayerID,
		)
	}

	if len(joinedRoom.Players) != 2 {
		t.Fatalf("expected two players, got %d", len(joinedRoom.Players))
	}
}

func TestCreateRoomRequiresPlayerName(t *testing.T) {
	manager := NewManager(nil)

	_, _, err := manager.CreateRoom(context.Background(), "")
	if err != ErrInvalidPlayerName {
		t.Fatalf("expected ErrInvalidPlayerName, got %v", err)
	}
}

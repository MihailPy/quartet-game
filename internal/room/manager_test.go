package room

import (
	"context"
	"errors"
	"testing"
)

func TestCreateRoomCreatesOwnerPlayer(t *testing.T) {
	manager := NewManager(nil, 8)

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
	manager := NewManager(nil, 8)

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
	manager := NewManager(nil, 8)

	_, _, err := manager.CreateRoom(context.Background(), "")
	if err != ErrInvalidPlayerName {
		t.Fatalf("expected ErrInvalidPlayerName, got %v", err)
	}
}

func TestJoinRoomFailsWhenRoomIsFull(t *testing.T) {
	manager := NewManager(nil, 2)

	_, createdRoom, err := manager.CreateRoom(context.Background(), "Mihail")
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}

	_, _, err = manager.JoinRoom(context.Background(), createdRoom.ID, "Anna")
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}

	_, _, err = manager.JoinRoom(context.Background(), createdRoom.ID, "John")
	if err != ErrRoomFull {
		t.Fatalf("expected ErrRoomFull, got %v", err)
	}
}

func TestJoinRoomFailsWhenRoomAlreadyStarted(t *testing.T) {
	manager := NewManager(nil, 4)

	owner, createdRoom, err := manager.CreateRoom(context.Background(), "Mihail")
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}

	secondPlayer, currentRoom, err := manager.JoinRoom(context.Background(), createdRoom.ID, "Anna")
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}

	currentRoom, err = manager.MarkPlayerReady(context.Background(), currentRoom.ID, owner.ID)
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}

	currentRoom, err = manager.MarkPlayerReady(context.Background(), currentRoom.ID, secondPlayer.ID)
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}

	currentRoom, err = manager.SetSelectedQuartets(
		context.Background(),
		currentRoom.ID,
		[]string{"quartet-1"},
	)
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}

	_, err = manager.StartRoom(context.Background(), currentRoom.ID)
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}

	_, _, err = manager.JoinRoom(context.Background(), currentRoom.ID, "John")
	if err != ErrRoomAlreadyStarted {
		t.Fatalf("expected ErrRoomAlreadyStarted, got %v", err)
	}
}

func TestCreateRoomSelectsOwnerByDefault(t *testing.T) {
	manager := NewMemoryManager()

	player, currentRoom, err := manager.CreateRoom(context.Background(), "Alice")
	if err != nil {
		t.Fatal(err)
	}

	if !currentRoom.SelectedPlayerIDs[player.ID] {
		t.Fatalf("expected owner to be selected by default")
	}
}

func TestJoinRoomSelectsPlayerByDefault(t *testing.T) {
	manager := NewMemoryManager()

	_, currentRoom, err := manager.CreateRoom(context.Background(), "Alice")
	if err != nil {
		t.Fatal(err)
	}

	player, updatedRoom, err := manager.JoinRoom(context.Background(), currentRoom.ID, "Bob")
	if err != nil {
		t.Fatal(err)
	}

	if !updatedRoom.SelectedPlayerIDs[player.ID] {
		t.Fatalf("expected joined player to be selected by default")
	}
}

func TestToggleSelectedPlayerRequiresOwner(t *testing.T) {
	manager := NewMemoryManager()

	owner, currentRoom, err := manager.CreateRoom(context.Background(), "Alice")
	if err != nil {
		t.Fatal(err)
	}

	joinedPlayer, _, err := manager.JoinRoom(context.Background(), currentRoom.ID, "Bob")
	if err != nil {
		t.Fatal(err)
	}

	_, err = manager.ToggleSelectedPlayer(
		context.Background(),
		currentRoom.ID,
		joinedPlayer.ID,
		owner.ID,
	)

	if !errors.Is(err, ErrOnlyOwnerCanSelectPlayers) {
		t.Fatalf("expected ErrOnlyOwnerCanSelectPlayers, got %v", err)
	}
}

func TestToggleSelectedPlayerUpdatesSelection(t *testing.T) {
	manager := NewMemoryManager()

	owner, currentRoom, err := manager.CreateRoom(context.Background(), "Alice")
	if err != nil {
		t.Fatal(err)
	}

	joinedPlayer, _, err := manager.JoinRoom(context.Background(), currentRoom.ID, "Bob")
	if err != nil {
		t.Fatal(err)
	}

	updatedRoom, err := manager.ToggleSelectedPlayer(
		context.Background(),
		currentRoom.ID,
		owner.ID,
		joinedPlayer.ID,
	)
	if err != nil {
		t.Fatal(err)
	}

	if updatedRoom.SelectedPlayerIDs[joinedPlayer.ID] {
		t.Fatalf("expected joined player to be unselected")
	}
}

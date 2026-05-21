package room

import (
	"crypto/rand"
	"encoding/hex"
	"errors"
	"sync"
)

var ErrRoomNotFound = errors.New("room not found")
var ErrInvalidPlayerName = errors.New("invalid player name")

type Manager struct {
	mu    sync.RWMutex
	rooms map[RoomID]Room
}

func NewManager() *Manager {
	return &Manager{
		rooms: make(map[RoomID]Room),
	}
}

func (m *Manager) CreateRoom() Room {
	m.mu.Lock()
	defer m.mu.Unlock()

	room := Room{
		ID:      RoomID(generateID()),
		Status:  RoomStatusWaiting,
		Players: []Player{},
	}

	m.rooms[room.ID] = room

	return room
}

func (m *Manager) GetRoom(id RoomID) (Room, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()

	room, ok := m.rooms[id]
	if !ok {
		return Room{}, ErrRoomNotFound
	}

	return room, nil
}

func generateID() string {
	bytes := make([]byte, 8)

	_, err := rand.Read(bytes)
	if err != nil {
		return "fallback-room-id"
	}

	return hex.EncodeToString(bytes)
}

func (m *Manager) JoinRoom(roomID RoomID, playerName string) (Player, Room, error) {
	if playerName == "" {
		return Player{}, Room{}, ErrInvalidPlayerName
	}

	m.mu.Lock()
	defer m.mu.Unlock()

	currentRoom, ok := m.rooms[roomID]
	if !ok {
		return Player{}, Room{}, ErrRoomNotFound
	}

	player := Player{
		ID:   PlayerID(generateID()),
		Name: playerName,
	}

	currentRoom.Players = append(currentRoom.Players, player)
	m.rooms[roomID] = currentRoom

	return player, currentRoom, nil
}

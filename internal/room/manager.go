package room

import (
	"crypto/rand"
	"encoding/hex"
	"errors"
	"sync"
)

var ErrRoomNotFound = errors.New("room not found")

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
		ID:     RoomID(generateID()),
		Status: RoomStatusWaiting,
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

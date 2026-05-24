package room

import (
	"crypto/rand"
	"encoding/hex"
	"errors"
	"sync"
)

var ErrRoomNotFound = errors.New("room not found")
var ErrInvalidPlayerName = errors.New("invalid player name")
var ErrPlayerNotFound = errors.New("player not found")
var ErrNotEnoughPlayers = errors.New("not enough players")
var ErrNotAllPlayersReady = errors.New("not all players ready")
var ErrRoomAlreadyStarted = errors.New("room already started")

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
		ID:          PlayerID(generateID()),
		Name:        playerName,
		IsReady:     false,
		IsConnected: false,
	}

	currentRoom.Players = append(currentRoom.Players, player)
	m.rooms[roomID] = currentRoom

	return player, currentRoom, nil
}

func (m *Manager) MarkPlayerReady(roomID RoomID, playerID PlayerID) (Room, error) {
	if playerID == "" {
		return Room{}, ErrPlayerNotFound
	}

	m.mu.Lock()
	defer m.mu.Unlock()

	currentRoom, ok := m.rooms[roomID]
	if !ok {
		return Room{}, ErrRoomNotFound
	}

	for i, player := range currentRoom.Players {
		if player.ID == playerID {
			currentRoom.Players[i].IsReady = true
			m.rooms[roomID] = currentRoom
			return currentRoom, nil
		}
	}

	return Room{}, ErrPlayerNotFound
}

func (m *Manager) StartRoom(roomID RoomID) (Room, error) {
	m.mu.Lock()
	defer m.mu.Unlock()

	currentRoom, ok := m.rooms[roomID]
	if !ok {
		return Room{}, ErrRoomNotFound
	}

	if currentRoom.Status == RoomStatusPlaying {
		return Room{}, ErrRoomAlreadyStarted
	}

	if len(currentRoom.Players) < 2 {
		return Room{}, ErrNotEnoughPlayers
	}

	for _, player := range currentRoom.Players {
		if !player.IsReady {
			return Room{}, ErrNotAllPlayersReady
		}
	}

	currentRoom.Status = RoomStatusPlaying
	m.rooms[roomID] = currentRoom

	return currentRoom, nil
}

func (m *Manager) SetPlayerConnected(roomID RoomID, playerID PlayerID, connected bool) (Room, error) {
	if playerID == "" {
		return Room{}, ErrPlayerNotFound
	}

	m.mu.Lock()
	defer m.mu.Unlock()

	currentRoom, ok := m.rooms[roomID]
	if !ok {
		return Room{}, ErrRoomNotFound
	}

	for i, player := range currentRoom.Players {
		if player.ID == playerID {
			currentRoom.Players[i].IsConnected = connected
			m.rooms[roomID] = currentRoom
			return currentRoom, nil
		}
	}

	return Room{}, ErrPlayerNotFound
}

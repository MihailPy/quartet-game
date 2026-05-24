package room

import (
	"context"
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

type Repository interface {
	SaveRoom(ctx context.Context, currentRoom Room) error
	SaveRoomPlayer(ctx context.Context, roomID RoomID, player Player) error
	UpdateRoomPlayerReady(ctx context.Context, roomID RoomID, playerID PlayerID, isReady bool) error
	UpdateRoomStatus(ctx context.Context, roomID RoomID, status RoomStatus) error
	UpdateRoomPlayerConnected(ctx context.Context, roomID RoomID, playerID PlayerID, isConnected bool) error
}

type Manager struct {
	mu         sync.RWMutex
	rooms      map[RoomID]Room
	repository Repository
}

func NewManager(repository Repository) *Manager {
	return &Manager{
		rooms:      make(map[RoomID]Room),
		repository: repository,
	}
}

func NewMemoryManager() *Manager {
	return &Manager{
		rooms: make(map[RoomID]Room),
	}
}

func (m *Manager) CreateRoom(ctx context.Context) (Room, error) {
	m.mu.Lock()
	defer m.mu.Unlock()

	currentRoom := Room{
		ID:      RoomID(generateID()),
		Status:  RoomStatusWaiting,
		Players: []Player{},
	}

	if m.repository != nil {
		if err := m.repository.SaveRoom(ctx, currentRoom); err != nil {
			return Room{}, err
		}
	}

	m.rooms[currentRoom.ID] = currentRoom

	return currentRoom, nil
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
	bytes := make([]byte, 16)

	_, err := rand.Read(bytes)
	if err != nil {
		return "00000000-0000-0000-0000-000000000000"
	}

	bytes[6] = (bytes[6] & 0x0f) | 0x40
	bytes[8] = (bytes[8] & 0x3f) | 0x80

	return hex.EncodeToString(bytes[0:4]) + "-" +
		hex.EncodeToString(bytes[4:6]) + "-" +
		hex.EncodeToString(bytes[6:8]) + "-" +
		hex.EncodeToString(bytes[8:10]) + "-" +
		hex.EncodeToString(bytes[10:16])
}

func (m *Manager) JoinRoom(ctx context.Context, roomID RoomID, playerName string) (Player, Room, error) {
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

	if m.repository != nil {
		if err := m.repository.SaveRoomPlayer(ctx, roomID, player); err != nil {
			return Player{}, Room{}, err
		}
	}

	currentRoom.Players = append(currentRoom.Players, player)
	m.rooms[roomID] = currentRoom

	return player, currentRoom, nil
}

func (m *Manager) MarkPlayerReady(ctx context.Context, roomID RoomID, playerID PlayerID) (Room, error) {
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

			if m.repository != nil {
				if err := m.repository.UpdateRoomPlayerReady(ctx, roomID, playerID, true); err != nil {
					return Room{}, err
				}
			}

			m.rooms[roomID] = currentRoom
			return currentRoom, nil
		}
	}

	return Room{}, ErrPlayerNotFound
}

func (m *Manager) StartRoom(ctx context.Context, roomID RoomID) (Room, error) {
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

	if m.repository != nil {
		if err := m.repository.UpdateRoomStatus(ctx, roomID, RoomStatusPlaying); err != nil {
			return Room{}, err
		}
	}

	m.rooms[roomID] = currentRoom

	return currentRoom, nil
}

func (m *Manager) SetPlayerConnected(ctx context.Context, roomID RoomID, playerID PlayerID, connected bool) (Room, error) {
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

			if m.repository != nil {
				if err := m.repository.UpdateRoomPlayerConnected(ctx, roomID, playerID, connected); err != nil {
					return Room{}, err
				}
			}

			m.rooms[roomID] = currentRoom
			return currentRoom, nil
		}
	}

	return Room{}, ErrPlayerNotFound
}

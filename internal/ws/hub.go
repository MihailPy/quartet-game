package ws

import (
	"sync"

	"github.com/MihailPy/quartet-game/internal/room"
	"github.com/gorilla/websocket"
)

type Event struct {
	Type    string      `json:"type"`
	Payload interface{} `json:"payload"`
}

type Hub struct {
	mu          sync.RWMutex
	connections map[room.RoomID]map[room.PlayerID]*websocket.Conn
}

func NewHub() *Hub {
	return &Hub{
		connections: make(map[room.RoomID]map[room.PlayerID]*websocket.Conn),
	}
}

func (h *Hub) AddConnection(roomID room.RoomID, playerID room.PlayerID, conn *websocket.Conn) {
	h.mu.Lock()
	defer h.mu.Unlock()

	if h.connections[roomID] == nil {
		h.connections[roomID] = make(map[room.PlayerID]*websocket.Conn)
	}

	h.connections[roomID][playerID] = conn
}

func (h *Hub) RemoveConnection(roomID room.RoomID, playerID room.PlayerID) {
	h.mu.Lock()
	defer h.mu.Unlock()

	if h.connections[roomID] == nil {
		return
	}

	delete(h.connections[roomID], playerID)

	if len(h.connections[roomID]) == 0 {
		delete(h.connections, roomID)
	}
}

func (h *Hub) BroadcastToRoom(roomID room.RoomID, event Event) {
	h.mu.RLock()
	defer h.mu.RUnlock()

	for _, conn := range h.connections[roomID] {
		_ = conn.WriteJSON(event)
	}
}

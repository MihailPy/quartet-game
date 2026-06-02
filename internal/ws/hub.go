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
	connections map[room.RoomID]map[room.PlayerID]*Client
}

type Client struct {
	conn    *websocket.Conn
	writeMu sync.Mutex
}

func (c *Client) WriteJSON(value interface{}) error {
	c.writeMu.Lock()
	defer c.writeMu.Unlock()

	return c.conn.WriteJSON(value)
}

func NewHub() *Hub {
	return &Hub{
		connections: make(map[room.RoomID]map[room.PlayerID]*Client),
	}
}

func (h *Hub) AddConnection(roomID room.RoomID, playerID room.PlayerID, conn *websocket.Conn) {
	h.mu.Lock()
	defer h.mu.Unlock()

	if h.connections[roomID] == nil {
		h.connections[roomID] = make(map[room.PlayerID]*Client)
	}

	h.connections[roomID][playerID] = &Client{
		conn: conn,
	}
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

	roomConnections := h.connections[roomID]
	clients := make([]*Client, 0, len(roomConnections))

	for _, client := range roomConnections {
		clients = append(clients, client)
	}

	h.mu.RUnlock()

	for _, client := range clients {
		_ = client.WriteJSON(event)
	}
}

func (h *Hub) SendToPlayer(roomID room.RoomID, playerID room.PlayerID, event Event) {
	h.mu.RLock()

	roomConnections := h.connections[roomID]
	if roomConnections == nil {
		h.mu.RUnlock()
		return
	}

	client := roomConnections[playerID]
	h.mu.RUnlock()

	if client == nil {
		return
	}

	_ = client.WriteJSON(event)
}

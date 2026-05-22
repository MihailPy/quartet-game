package ws

import (
	"net/http"

	"github.com/MihailPy/quartet-game/internal/room"
	"github.com/gorilla/websocket"
)

type Handler struct {
	roomManager *room.Manager
	hub         *Hub
}

func NewHandler(roomManager *room.Manager, hub *Hub) *Handler {
	return &Handler{
		roomManager: roomManager,
		hub:         hub,
	}
}

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

func (h *Handler) HandleConnection(w http.ResponseWriter, r *http.Request, roomID room.RoomID) {
	playerID := room.PlayerID(r.URL.Query().Get("player_id"))
	if playerID == "" {
		w.WriteHeader(http.StatusBadRequest)
		return
	}

	foundRoom, err := h.roomManager.GetRoom(roomID)
	if err != nil {
		w.WriteHeader(http.StatusNotFound)
		return
	}

	if !playerExists(foundRoom, playerID) {
		w.WriteHeader(http.StatusBadRequest)
		return
	}

	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		return
	}

	defer conn.Close()
	h.hub.AddConnection(roomID, playerID, conn)
	defer h.hub.RemoveConnection(roomID, playerID)

	h.hub.BroadcastToRoom(roomID, Event{
		Type: "player_connected",
		Payload: map[string]string{
			"room_id":   string(roomID),
			"player_id": string(playerID),
		},
	})

	for {
		_, _, err := conn.ReadMessage()
		if err != nil {
			return
		}
	}
}

func playerExists(foundRoom room.Room, playerID room.PlayerID) bool {
	for _, player := range foundRoom.Players {
		if player.ID == playerID {
			return true
		}
	}

	return false
}

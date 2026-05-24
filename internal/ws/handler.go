package ws

import (
	"context"
	"encoding/json"
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

type ClientMessage struct {
	Type    string          `json:"type"`
	Payload json.RawMessage `json:"payload"`
}

type RequestCardPayload struct {
	TargetPlayerID string `json:"target_player_id"`
	CardID         string `json:"card_id"`
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

	foundRoom, err := h.roomManager.GetRoom(r.Context(), roomID)
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
	_, _ = h.roomManager.SetPlayerConnected(r.Context(), roomID, playerID, true)

	defer func() {
		h.hub.RemoveConnection(roomID, playerID)
		_, _ = h.roomManager.SetPlayerConnected(r.Context(), roomID, playerID, false)

		h.hub.BroadcastToRoom(roomID, Event{
			Type: "player_disconnected",
			Payload: map[string]string{
				"room_id":   string(roomID),
				"player_id": string(playerID),
			},
		})

		h.broadcastRoomState(roomID)
	}()

	h.hub.BroadcastToRoom(roomID, Event{
		Type: "player_connected",
		Payload: map[string]string{
			"room_id":   string(roomID),
			"player_id": string(playerID),
		},
	})

	h.broadcastRoomState(roomID)

	for {
		_, data, err := conn.ReadMessage()
		if err != nil {
			return
		}

		var message ClientMessage

		if err := json.Unmarshal(data, &message); err != nil {
			_ = conn.WriteJSON(Event{
				Type: "error",
				Payload: map[string]string{
					"message": "invalid message format",
				},
			})
			continue
		}

		switch message.Type {
		case "request_card":
			h.handleRequestCard(roomID, playerID, message.Payload)
		default:
			_ = conn.WriteJSON(Event{
				Type: "error",
				Payload: map[string]string{
					"message": "unknown message type",
				},
			})
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

func (h *Handler) handleRequestCard(roomID room.RoomID, playerID room.PlayerID, payload json.RawMessage) {
	var request RequestCardPayload

	if err := json.Unmarshal(payload, &request); err != nil {
		h.hub.SendToPlayer(roomID, playerID, Event{
			Type: "error",
			Payload: map[string]string{
				"message": "invalid request_card payload",
			},
		})
		return
	}

	if request.TargetPlayerID == "" || request.CardID == "" {
		h.hub.SendToPlayer(roomID, playerID, Event{
			Type: "error",
			Payload: map[string]string{
				"message": "target_player_id and card_id are required",
			},
		})
		return
	}

	h.hub.BroadcastToRoom(roomID, Event{
		Type: "card_requested",
		Payload: map[string]string{
			"actor_player_id":  string(playerID),
			"target_player_id": request.TargetPlayerID,
			"card_id":          request.CardID,
		},
	})

	h.broadcastRoomState(roomID)
}

func (h *Handler) broadcastRoomState(roomID room.RoomID) {
	foundRoom, err := h.roomManager.GetRoom(context.Background(), roomID)
	if err != nil {
		return
	}

	h.hub.BroadcastToRoom(roomID, Event{
		Type:    "room_state",
		Payload: foundRoom,
	})
}

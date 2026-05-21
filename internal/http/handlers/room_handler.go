package handlers

import (
	"encoding/json"
	"net/http"

	"github.com/MihailPy/quartet-game/internal/room"
)

type RoomHandler struct {
	manager *room.Manager
}

func NewRoomHandler(manager *room.Manager) *RoomHandler {
	return &RoomHandler{
		manager: manager,
	}
}

func (h *RoomHandler) CreateRoom(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}

	createdRoom := h.manager.CreateRoom()

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)

	_ = json.NewEncoder(w).Encode(createdRoom)
}

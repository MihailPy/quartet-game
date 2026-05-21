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

type JoinRoomRequest struct {
	Name string `json:"name"`
}

type JoinRoomResponse struct {
	Player room.Player `json:"player"`
	Room   room.Room   `json:"room"`
}

func (h *RoomHandler) JoinRoom(w http.ResponseWriter, r *http.Request, roomID room.RoomID) {
	if r.Method != http.MethodPost {
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}

	var req JoinRoomRequest

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		w.WriteHeader(http.StatusBadRequest)
		return
	}

	player, joinedRoom, err := h.manager.JoinRoom(roomID, req.Name)
	if err != nil {
		if err == room.ErrRoomNotFound {
			w.WriteHeader(http.StatusNotFound)
			return
		}

		w.WriteHeader(http.StatusBadRequest)
		return
	}

	response := JoinRoomResponse{
		Player: player,
		Room:   joinedRoom,
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)

	_ = json.NewEncoder(w).Encode(response)
}

func (h *RoomHandler) GetRoom(w http.ResponseWriter, r *http.Request, roomID room.RoomID) {
	if r.Method != http.MethodGet {
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}

	foundRoom, err := h.manager.GetRoom(roomID)
	if err != nil {
		if err == room.ErrRoomNotFound {
			w.WriteHeader(http.StatusNotFound)
			return
		}

		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)

	_ = json.NewEncoder(w).Encode(foundRoom)
}

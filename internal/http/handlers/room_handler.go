package handlers

import (
	"context"
	"encoding/json"
	"net/http"

	"github.com/MihailPy/quartet-game/internal/game"
	"github.com/MihailPy/quartet-game/internal/room"
)

type GameStarter interface {
	StartGame(ctx context.Context, currentRoom room.Room) (game.GameState, error)
}

type RoomHandler struct {
	manager     *room.Manager
	gameStarter GameStarter
}

type JoinRoomRequest struct {
	Name string `json:"name"`
}

type JoinRoomResponse struct {
	Player room.Player `json:"player"`
	Room   room.Room   `json:"room"`
}

type ReadyRoomRequest struct {
	PlayerID room.PlayerID `json:"player_id"`
}

func NewRoomHandler(manager *room.Manager, gameStarter GameStarter) *RoomHandler {
	return &RoomHandler{
		manager:     manager,
		gameStarter: gameStarter,
	}
}

func (h *RoomHandler) CreateRoom(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}
	createdRoom, err := h.manager.CreateRoom(r.Context())
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)

	_ = json.NewEncoder(w).Encode(createdRoom)
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

	player, joinedRoom, err := h.manager.JoinRoom(r.Context(), roomID, req.Name)
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

	foundRoom, err := h.manager.GetRoom(r.Context(), roomID)
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

func (h *RoomHandler) MarkPlayerReady(w http.ResponseWriter, r *http.Request, roomID room.RoomID) {
	if r.Method != http.MethodPost {
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}

	var req ReadyRoomRequest

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		w.WriteHeader(http.StatusBadRequest)
		return
	}

	updatedRoom, err := h.manager.MarkPlayerReady(r.Context(), roomID, req.PlayerID)
	if err != nil {
		switch err {
		case room.ErrRoomNotFound:
			w.WriteHeader(http.StatusNotFound)
		case room.ErrPlayerNotFound:
			w.WriteHeader(http.StatusBadRequest)
		default:
			w.WriteHeader(http.StatusInternalServerError)
		}

		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)

	_ = json.NewEncoder(w).Encode(updatedRoom)
}

func (h *RoomHandler) StartRoom(w http.ResponseWriter, r *http.Request, roomID room.RoomID) {
	if r.Method != http.MethodPost {
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}

	startedRoom, err := h.manager.StartRoom(r.Context(), roomID)
	if err != nil {
		switch err {
		case room.ErrRoomNotFound:
			w.WriteHeader(http.StatusNotFound)
		case room.ErrNotEnoughPlayers, room.ErrNotAllPlayersReady, room.ErrRoomAlreadyStarted:
			w.WriteHeader(http.StatusBadRequest)
		default:
			w.WriteHeader(http.StatusInternalServerError)
		}

		return
	}

	gameState, err := h.gameStarter.StartGame(r.Context(), startedRoom)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	response := struct {
		Room room.Room      `json:"room"`
		Game game.GameState `json:"game"`
	}{
		Room: startedRoom,
		Game: gameState,
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	_ = json.NewEncoder(w).Encode(response)
}

func (h *RoomHandler) GetRoomState(w http.ResponseWriter, r *http.Request, roomID room.RoomID) {
	if r.Method != http.MethodGet {
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}

	foundRoom, err := h.manager.GetRoom(r.Context(), roomID)
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

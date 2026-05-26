package handlers

import (
	"context"
	"encoding/json"
	"net/http"

	"github.com/MihailPy/quartet-game/internal/game"
	"github.com/MihailPy/quartet-game/internal/room"
	"github.com/MihailPy/quartet-game/internal/ws"
)

type GameStarter interface {
	StartGame(ctx context.Context, currentRoom room.Room) (game.GameState, error)
}

type RoomHandler struct {
	manager          *room.Manager
	gameStarter      GameStarter
	eventBroadcaster EventBroadcaster
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

type EventBroadcaster interface {
	BroadcastToRoom(roomID room.RoomID, event ws.Event)
	SendToPlayer(roomID room.RoomID, playerID room.PlayerID, event ws.Event)
}

type GameStartedPayload struct {
	Room room.Room `json:"room"`
}

type GameStatePayload struct {
	GameID          string              `json:"game_id"`
	Status          string              `json:"status"`
	CurrentPlayerID string              `json:"current_player_id"`
	Players         []GamePlayerState   `json:"players"`
	Completed       map[string][]string `json:"completed"`
}

type GamePlayerState struct {
	ID        string `json:"id"`
	Name      string `json:"name"`
	CardCount int    `json:"card_count"`
}

type PlayerHandPayload struct {
	PlayerID string      `json:"player_id"`
	Cards    []CardState `json:"cards"`
}

type CardState struct {
	ID        string `json:"id"`
	QuartetID string `json:"quartet_id"`
	Title     string `json:"title"`
}

func NewRoomHandler(
	manager *room.Manager,
	gameStarter GameStarter,
	eventBroadcaster EventBroadcaster,
) *RoomHandler {
	return &RoomHandler{
		manager:          manager,
		gameStarter:      gameStarter,
		eventBroadcaster: eventBroadcaster,
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

	if h.eventBroadcaster != nil {
		h.eventBroadcaster.BroadcastToRoom(roomID, ws.Event{
			Type: "game_started",
			Payload: GameStartedPayload{
				Room: startedRoom,
			},
		})

		h.eventBroadcaster.BroadcastToRoom(roomID, ws.Event{
			Type:    "game_state",
			Payload: buildGameStatePayload(gameState),
		})

		for _, player := range gameState.Players {
			h.eventBroadcaster.SendToPlayer(roomID, room.PlayerID(player.ID), ws.Event{
				Type:    "player_hand",
				Payload: buildPlayerHandPayload(gameState, player.ID),
			})
		}
	}
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

func buildGameStatePayload(state game.GameState) GameStatePayload {
	players := make([]GamePlayerState, 0, len(state.Players))

	for _, player := range state.Players {
		players = append(players, GamePlayerState{
			ID:        string(player.ID),
			Name:      player.Name,
			CardCount: len(state.Hands[player.ID]),
		})
	}

	completed := make(map[string][]string)

	for playerID, quartetIDs := range state.Completed {
		completed[string(playerID)] = make([]string, 0, len(quartetIDs))

		for _, quartetID := range quartetIDs {
			completed[string(playerID)] = append(
				completed[string(playerID)],
				string(quartetID),
			)
		}
	}

	return GameStatePayload{
		GameID:          string(state.ID),
		Status:          string(state.Status),
		CurrentPlayerID: string(state.CurrentPlayerID),
		Players:         players,
		Completed:       completed,
	}
}

func buildPlayerHandPayload(state game.GameState, playerID game.PlayerID) PlayerHandPayload {
	cards := make([]CardState, 0, len(state.Hands[playerID]))

	for _, card := range state.Hands[playerID] {
		cards = append(cards, CardState{
			ID:        string(card.ID),
			QuartetID: string(card.QuartetID),
			Title:     card.Title,
		})
	}

	return PlayerHandPayload{
		PlayerID: string(playerID),
		Cards:    cards,
	}
}

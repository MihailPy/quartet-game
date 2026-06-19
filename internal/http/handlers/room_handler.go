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
	GetGameState(ctx context.Context, roomID room.RoomID) (game.GameState, bool)
}

type RoomHandler struct {
	manager          *room.Manager
	gameStarter      GameStarter
	eventBroadcaster EventBroadcaster
	deckService      DeckService
}

type CreateRoomRequest struct {
	Name string `json:"name"`
}

type CreateRoomResponse struct {
	Player room.Player `json:"player"`
	Room   room.Room   `json:"room"`
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
	Deck game.Deck `json:"deck"`
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

type StartRoomRequest struct {
	PlayerID room.PlayerID `json:"player_id"`
}

type ToggleSelectedPlayerRequest struct {
	OwnerPlayerID  room.PlayerID `json:"owner_player_id"`
	TargetPlayerID room.PlayerID `json:"target_player_id"`
}

type ToggleSelectedQuartetRequest struct {
	OwnerPlayerID room.PlayerID `json:"owner_player_id"`
	QuartetID     string        `json:"quartet_id"`
}

type DeckService interface {
	LoadAvailableQuartets(ctx context.Context, ownerPlayerID room.PlayerID) ([]game.Quartet, error)
}

func NewRoomHandler(
	manager *room.Manager,
	gameStarter GameStarter,
	eventBroadcaster EventBroadcaster,
	deckService DeckService,
) *RoomHandler {
	return &RoomHandler{
		manager:          manager,
		gameStarter:      gameStarter,
		eventBroadcaster: eventBroadcaster,
		deckService:      deckService,
	}
}

func (h *RoomHandler) CreateRoom(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		writeError(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}

	var req CreateRoomRequest

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid create room request")
		return
	}

	player, createdRoom, err := h.manager.CreateRoom(r.Context(), req.Name)
	if err != nil {
		if err == room.ErrInvalidPlayerName {
			writeError(w, http.StatusBadRequest, "player name is required")
			return
		}

		writeError(w, http.StatusInternalServerError, "failed to create room")
		return
	}

	availableQuartets, err := h.deckService.LoadAvailableQuartets(
		r.Context(),
		player.ID,
	)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	selectedQuartetIDs := make([]string, 0, len(availableQuartets))

	for _, quartet := range availableQuartets {
		selectedQuartetIDs = append(selectedQuartetIDs, string(quartet.ID))
	}

	createdRoom, err = h.manager.SetSelectedQuartets(
		r.Context(),
		createdRoom.ID,
		selectedQuartetIDs,
	)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	response := CreateRoomResponse{
		Player: player,
		Room:   createdRoom,
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)

	_ = json.NewEncoder(w).Encode(response)
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
		if err == room.ErrInvalidPlayerName {
			writeError(w, http.StatusBadRequest, "player name is required")
			return
		}

		if err == room.ErrRoomNotFound {
			writeError(w, http.StatusNotFound, "room not found")
			return
		}

		if err == room.ErrRoomAlreadyStarted {
			writeError(w, http.StatusConflict, "room already started")
			return
		}

		if err == room.ErrRoomFull {
			writeError(w, http.StatusConflict, "room is full")
			return
		}

		writeError(w, http.StatusInternalServerError, "failed to join room")
		return
	}

	if h.eventBroadcaster != nil {
		h.eventBroadcaster.BroadcastToRoom(roomID, ws.Event{
			Type:    "room_updated",
			Payload: joinedRoom,
		})
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

	if h.eventBroadcaster != nil {
		h.eventBroadcaster.BroadcastToRoom(roomID, ws.Event{
			Type:    "room_updated",
			Payload: updatedRoom,
		})
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)

	_ = json.NewEncoder(w).Encode(updatedRoom)
}

func (h *RoomHandler) ToggleSelectedPlayer(w http.ResponseWriter, r *http.Request, roomID room.RoomID) {
	if r.Method != http.MethodPost {
		writeError(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}

	var request ToggleSelectedPlayerRequest
	if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
		writeError(w, http.StatusBadRequest, "invalid toggle selected player request")
		return
	}

	updatedRoom, err := h.manager.ToggleSelectedPlayer(
		r.Context(),
		roomID,
		request.OwnerPlayerID,
		request.TargetPlayerID,
	)
	if err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}

	if h.eventBroadcaster != nil {
		h.eventBroadcaster.BroadcastToRoom(roomID, ws.Event{
			Type:    "room_updated",
			Payload: updatedRoom,
		})
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)

	_ = json.NewEncoder(w).Encode(updatedRoom)
}

func (h *RoomHandler) ToggleSelectedQuartet(w http.ResponseWriter, r *http.Request, roomID room.RoomID) {
	if r.Method != http.MethodPost {
		writeError(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}

	var request ToggleSelectedQuartetRequest
	if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
		writeError(w, http.StatusBadRequest, "invalid toggle selected quartet request")
		return
	}

	updatedRoom, err := h.manager.ToggleSelectedQuartet(
		r.Context(),
		roomID,
		request.OwnerPlayerID,
		request.QuartetID,
	)
	if err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}

	if h.eventBroadcaster != nil {
		h.eventBroadcaster.BroadcastToRoom(roomID, ws.Event{
			Type:    "room_updated",
			Payload: updatedRoom,
		})
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)

	_ = json.NewEncoder(w).Encode(updatedRoom)
}

func (h *RoomHandler) StartRoom(w http.ResponseWriter, r *http.Request, roomID room.RoomID) {
	if r.Method != http.MethodPost {
		writeError(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}

	var request StartRoomRequest
	if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
		writeError(w, http.StatusBadRequest, "invalid start game request")
		return
	}

	if request.PlayerID == "" {
		writeError(w, http.StatusBadRequest, "player_id is required")
		return
	}

	currentRoom, err := h.manager.GetRoom(r.Context(), roomID)
	if err != nil {
		w.WriteHeader(http.StatusNotFound)
		return
	}

	if currentRoom.OwnerPlayerID != request.PlayerID {
		writeError(w, http.StatusForbidden, "only room owner can start game")
		return
	}

	selectedPlayersCount := 0

	for _, player := range currentRoom.Players {
		if currentRoom.SelectedPlayerIDs[player.ID] {
			selectedPlayersCount++
		}
	}

	if selectedPlayersCount < 2 {
		writeError(w, http.StatusBadRequest, room.ErrNotEnoughPlayers.Error())
		return
	}

	startedRoom, err := h.manager.StartRoom(r.Context(), roomID)
	if err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}

	gameState, err := h.gameStarter.StartGame(r.Context(), startedRoom)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	response := struct {
		Room  room.Room        `json:"room"`
		State GameStatePayload `json:"state"`
	}{
		Room:  startedRoom,
		State: buildGameStatePayload(gameState),
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	_ = json.NewEncoder(w).Encode(response)

	if h.eventBroadcaster != nil {
		h.eventBroadcaster.BroadcastToRoom(roomID, ws.Event{
			Type: "game_started",
			Payload: GameStartedPayload{
				Room: startedRoom,
				Deck: gameState.Deck,
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

func (h *RoomHandler) GetRoomDeck(w http.ResponseWriter, r *http.Request, roomID room.RoomID) {
	if r.Method != http.MethodGet {
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}

	currentRoom, err := h.manager.GetRoom(r.Context(), roomID)
	if err != nil {
		w.WriteHeader(http.StatusNotFound)
		return
	}

	gameState, ok := h.gameStarter.GetGameState(r.Context(), roomID)
	if !ok {
		w.WriteHeader(http.StatusNotFound)
		return
	}

	_ = currentRoom

	response := struct {
		Deck game.Deck `json:"deck"`
	}{
		Deck: gameState.Deck,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

func (h *RoomHandler) GetPlayerHand(w http.ResponseWriter, r *http.Request, roomID room.RoomID) {
	if r.Method != http.MethodGet {
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}

	playerID := r.URL.Query().Get("player_id")
	if playerID == "" {
		w.WriteHeader(http.StatusBadRequest)
		return
	}

	gameState, ok := h.gameStarter.GetGameState(r.Context(), roomID)
	if !ok {
		w.WriteHeader(http.StatusNotFound)
		return
	}

	payload := buildPlayerHandPayload(gameState, game.PlayerID(playerID))

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(payload)
}

func (h *RoomHandler) GetGameState(w http.ResponseWriter, r *http.Request, roomID room.RoomID) {
	if r.Method != http.MethodGet {
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}

	gameState, ok := h.gameStarter.GetGameState(r.Context(), roomID)
	if !ok {
		w.WriteHeader(http.StatusNotFound)
		return
	}

	payload := buildGameStatePayload(gameState)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(payload)
}

func writeError(w http.ResponseWriter, statusCode int, message string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)

	_ = json.NewEncoder(w).Encode(map[string]string{
		"error": message,
	})
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

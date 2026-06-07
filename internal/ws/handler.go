package ws

import (
	"context"
	"encoding/json"
	"net/http"

	"github.com/MihailPy/quartet-game/internal/game"
	"github.com/MihailPy/quartet-game/internal/room"
	"github.com/gorilla/websocket"
)

type ErrorPayload struct {
	Code    string `json:"code"`
	Message string `json:"message"`
}

type Handler struct {
	roomManager *room.Manager
	hub         *Hub
	gameService GameService
}

func NewHandler(roomManager *room.Manager, hub *Hub, gameService GameService) *Handler {
	return &Handler{
		roomManager: roomManager,
		hub:         hub,
		gameService: gameService,
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

type GameService interface {
	RequestCard(
		ctx context.Context,
		roomID room.RoomID,
		actorID room.PlayerID,
		targetPlayerID room.PlayerID,
		cardID game.CardID,
	) (game.RequestCardResult, game.GameState, error)
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

type GameFinishedPayload struct {
	GameID  string        `json:"game_id"`
	Winners []string      `json:"winners"`
	Scores  []PlayerScore `json:"scores"`
}

type PlayerScore struct {
	PlayerID string `json:"player_id"`
	Score    int    `json:"score"`
}

type TurnChangedPayload struct {
	CurrentPlayerID string `json:"current_player_id"`
}

type QuartetCompletedPayload struct {
	PlayerID string   `json:"player_id"`
	Quartets []string `json:"quartets"`
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
			h.hub.SendToPlayer(roomID, playerID, Event{
				Type: "error",
				Payload: map[string]string{
					"message": "invalid message format",
				},
			})
			continue
		}

		switch message.Type {
		case "request_card":
			h.handleRequestCard(r.Context(), roomID, playerID, message.Payload)
		default:
			h.hub.SendToPlayer(roomID, playerID, Event{
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

func (h *Handler) handleRequestCard(
	ctx context.Context,
	roomID room.RoomID,
	playerID room.PlayerID,
	payload json.RawMessage,
) {
	var request RequestCardPayload

	if err := json.Unmarshal(payload, &request); err != nil {
		h.hub.SendToPlayer(roomID, playerID, Event{
			Type: "request_card_error",
			Payload: ErrorPayload{
				Code:    "invalid_payload",
				Message: "invalid request_card payload",
			},
		})
		return
	}

	if request.TargetPlayerID == "" || request.CardID == "" {
		h.hub.SendToPlayer(roomID, playerID, Event{
			Type: "request_card_error",
			Payload: ErrorPayload{
				Code:    "missing_fields",
				Message: "target_player_id and card_id are required",
			},
		})
		return
	}

	result, state, err := h.gameService.RequestCard(
		ctx,
		roomID,
		playerID,
		room.PlayerID(request.TargetPlayerID),
		game.CardID(request.CardID),
	)

	if err != nil {
		h.sendError(
			roomID,
			playerID,
			"request_card_error",
			requestCardErrorCode(err),
			err,
		)
		return
	}

	h.hub.BroadcastToRoom(roomID, Event{
		Type: "card_request_result",
		Payload: map[string]any{
			"success":            result.Success,
			"requested_card":     result.RequestedCard,
			"completed_quartets": result.CompletedQuartets,
			"next_player_id":     result.NextPlayerID,
			"current_player_id":  state.CurrentPlayerID,
			"game_status":        state.Status,
		},
	})

	h.hub.BroadcastToRoom(roomID, Event{
		Type: "turn_changed",
		Payload: TurnChangedPayload{
			CurrentPlayerID: string(state.CurrentPlayerID),
		},
	})

	if len(result.CompletedQuartets) > 0 {
		quartets := make([]string, 0, len(result.CompletedQuartets))

		for _, quartetID := range result.CompletedQuartets {
			quartets = append(quartets, string(quartetID))
		}

		h.hub.BroadcastToRoom(roomID, Event{
			Type: "quartet_completed",
			Payload: QuartetCompletedPayload{
				PlayerID: string(playerID),
				Quartets: quartets,
			},
		})
	}

	h.hub.BroadcastToRoom(roomID, Event{
		Type:    "game_state",
		Payload: buildGameStatePayload(state),
	})

	for _, player := range state.Players {
		h.hub.SendToPlayer(roomID, room.PlayerID(player.ID), Event{
			Type:    "player_hand",
			Payload: buildPlayerHandPayload(state, player.ID),
		})
	}

	if state.Status == game.GameStatusFinished {
		h.hub.BroadcastToRoom(roomID, Event{
			Type:    "game_finished",
			Payload: buildGameFinishedPayload(state),
		})
	}
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

func (h *Handler) sendError(roomID room.RoomID, playerID room.PlayerID, eventType string, code string, err error) {
	h.hub.SendToPlayer(roomID, playerID, Event{
		Type: eventType,
		Payload: ErrorPayload{
			Code:    code,
			Message: err.Error(),
		},
	})
}

func requestCardErrorCode(err error) string {
	switch err {
	case game.ErrNotPlayerTurn:
		return "not_player_turn"
	case game.ErrCardNotFound:
		return "card_not_found"
	case game.ErrPlayerHasNoCardFromQuartet:
		return "player_has_no_card_from_quartet"
	case game.ErrInvalidRequestCardCommand:
		return "invalid_request_card_command"
	case game.ErrCannotRequestCard:
		return "cannot_request_card"
	case game.ErrCannotTransferCard:
		return "cannot_transfer_card"
	case game.ErrTargetPlayerHasNoCards:
		return "target_player_has_no_cards"
	default:
		return "unknown_error"
	}
}

func buildGameFinishedPayload(state game.GameState) GameFinishedPayload {
	result := game.CalculateGameResult(&state)

	winners := make([]string, 0, len(result.Winners))
	for _, winnerID := range result.Winners {
		winners = append(winners, string(winnerID))
	}

	scores := make([]PlayerScore, 0, len(result.Scores))
	for playerID, score := range result.Scores {
		scores = append(scores, PlayerScore{
			PlayerID: string(playerID),
			Score:    score,
		})
	}

	return GameFinishedPayload{
		GameID:  string(state.ID),
		Winners: winners,
		Scores:  scores,
	}
}

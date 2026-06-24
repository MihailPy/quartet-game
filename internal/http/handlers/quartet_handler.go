package handlers

import (
	"context"
	"encoding/json"
	"net/http"
	"time"

	"github.com/MihailPy/quartet-game/internal/game"
	"github.com/MihailPy/quartet-game/internal/user"
)

type QuartetRepository interface {
	CreateUserQuartet(
		ctx context.Context,
		ownerUserID user.UserID,
		newQuartet game.Quartet,
		now time.Time,
	) error
	ListUserQuartets(
		ctx context.Context,
		ownerUserID user.UserID,
	) ([]game.Quartet, error)
	DeleteUserQuartet(
		ctx context.Context,
		ownerUserID user.UserID,
		quartetID game.QuartetID,
	) error
}

type QuartetHandler struct {
	repository QuartetRepository
}

type CreateUserQuartetRequest struct {
	OwnerUserID user.UserID `json:"owner_user_id"`
	Title       string      `json:"title"`
	Cards       []string    `json:"cards"`
}

func NewQuartetHandler(repository QuartetRepository) *QuartetHandler {
	return &QuartetHandler{
		repository: repository,
	}
}

func (h *QuartetHandler) CreateUserQuartet(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		writeError(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}

	var request CreateUserQuartetRequest
	if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
		writeError(w, http.StatusBadRequest, "invalid create quartet request")
		return
	}

	if request.OwnerUserID == "" || request.Title == "" || len(request.Cards) != 4 {
		writeError(w, http.StatusBadRequest, "invalid quartet")
		return
	}

	quartetID := game.QuartetID(generateID())

	cards := make([]game.Card, 0, 4)

	for _, cardTitle := range request.Cards {
		if cardTitle == "" {
			writeError(w, http.StatusBadRequest, "invalid card title")
			return
		}

		cards = append(cards, game.Card{
			ID:        game.CardID(generateID()),
			QuartetID: quartetID,
			Title:     cardTitle,
		})
	}

	newQuartet := game.Quartet{
		ID:    quartetID,
		Title: request.Title,
		Cards: cards,
	}

	if err := h.repository.CreateUserQuartet(
		r.Context(),
		request.OwnerUserID,
		newQuartet,
		time.Now().UTC(),
	); err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)

	_ = json.NewEncoder(w).Encode(newQuartet)
}

func (h *QuartetHandler) ListUserQuartets(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		writeError(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}

	userID := user.UserID(r.URL.Query().Get("user_id"))
	if userID == "" {
		writeError(w, http.StatusBadRequest, "user_id is required")
		return
	}

	quartets, err := h.repository.ListUserQuartets(r.Context(), userID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)

	_ = json.NewEncoder(w).Encode(quartets)
}

func (h *QuartetHandler) DeleteUserQuartet(
	w http.ResponseWriter,
	r *http.Request,
	ownerUserID user.UserID,
	quartetID game.QuartetID,
) {
	if r.Method != http.MethodDelete {
		writeError(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}

	if ownerUserID == "" || quartetID == "" {
		writeError(w, http.StatusBadRequest, "invalid quartet delete request")
		return
	}

	err := h.repository.DeleteUserQuartet(
		r.Context(),
		ownerUserID,
		quartetID,
	)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

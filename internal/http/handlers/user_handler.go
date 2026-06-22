package handlers

import (
	"context"
	"encoding/json"
	"net/http"
	"time"

	"github.com/MihailPy/quartet-game/internal/user"
)

type UserRepository interface {
	SaveUser(ctx context.Context, currentUser user.User) error
	FindUserByID(ctx context.Context, userID user.UserID) (user.User, error)
}

type UserHandler struct {
	repository UserRepository
}

type CreateUserRequest struct {
	PlayerName string `json:"player_name"`
}

type CreateUserResponse struct {
	User user.User `json:"user"`
}

func NewUserHandler(repository UserRepository) *UserHandler {
	return &UserHandler{
		repository: repository,
	}
}

// Временный локальный helper
func generateID() string {
	return time.Now().UTC().Format("20060102150405.000000000")
}

func (h *UserHandler) CreateUser(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		writeError(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}

	var request CreateUserRequest
	if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
		writeError(w, http.StatusBadRequest, "invalid create user request")
		return
	}

	now := time.Now().UTC()

	currentUser, err := user.NewUser(
		user.UserID(generateID()),
		request.PlayerName,
		now,
	)
	if err != nil {
		writeError(w, http.StatusBadRequest, "player name is required")
		return
	}

	if err := h.repository.SaveUser(r.Context(), currentUser); err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	response := CreateUserResponse{
		User: currentUser,
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)

	_ = json.NewEncoder(w).Encode(response)
}

func (h *UserHandler) GetUser(w http.ResponseWriter, r *http.Request, userID user.UserID) {
	if r.Method != http.MethodGet {
		writeError(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}

	currentUser, err := h.repository.FindUserByID(r.Context(), userID)
	if err != nil {
		writeError(w, http.StatusNotFound, err.Error())
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)

	_ = json.NewEncoder(w).Encode(currentUser)
}

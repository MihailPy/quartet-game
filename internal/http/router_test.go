package http

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/MihailPy/quartet-game/internal/game"
	"github.com/MihailPy/quartet-game/internal/http/handlers"
	"github.com/MihailPy/quartet-game/internal/room"
)

type fakeGameStarter struct{}

func (f fakeGameStarter) StartGame(ctx context.Context, currentRoom room.Room) (game.GameState, error) {
	return game.GameState{}, nil
}

var _ handlers.GameStarter = fakeGameStarter{}

func TestHealthHandler(t *testing.T) {
	roomManager := room.NewMemoryManager()
	gameStarter := fakeGameStarter{}

	router := NewRouter(roomManager, gameStarter)

	req := httptest.NewRequest(http.MethodGet, "/health", nil)
	rec := httptest.NewRecorder()

	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected status %d, got %d", http.StatusOK, rec.Code)
	}

	if rec.Body.String() != "OK" {
		t.Fatalf("expected body OK, got %s", rec.Body.String())
	}
}

package http

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/MihailPy/quartet-game/internal/game"
	"github.com/MihailPy/quartet-game/internal/room"
	"github.com/MihailPy/quartet-game/internal/ws"
)

type fakeGameStarter struct {
	state    game.GameState
	err      error
	hasState bool
}

type fakeDeckService struct{}

func (f fakeDeckService) LoadAvailableQuartets(ctx context.Context, ownerPlayerID room.PlayerID) ([]game.Quartet, error) {
	return nil, nil
}

func (f fakeGameStarter) StartGame(ctx context.Context, currentRoom room.Room) (game.GameState, error) {
	if f.err != nil {
		return game.GameState{}, f.err
	}

	return f.state, nil
}

func (f fakeGameStarter) GetGameState(ctx context.Context, roomID room.RoomID) (game.GameState, bool) {
	if !f.hasState {
		return game.GameState{}, false
	}

	return f.state, true
}

func (f fakeGameStarter) RequestCard(
	ctx context.Context,
	roomID room.RoomID,
	actorID room.PlayerID,
	targetPlayerID room.PlayerID,
	cardID game.CardID,
) (game.RequestCardResult, game.GameState, error) {
	return game.RequestCardResult{}, game.GameState{}, nil
}

var _ ws.GameService = fakeGameStarter{}

func TestHealthHandler(t *testing.T) {
	roomManager := room.NewMemoryManager()
	gameStarter := fakeGameStarter{}

	deckService := fakeDeckService{}

	router := NewRouter(roomManager, gameStarter, gameStarter, deckService)

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

package gameapp

import (
	"context"
	"errors"
	"testing"

	"github.com/MihailPy/quartet-game/internal/game"
	"github.com/MihailPy/quartet-game/internal/room"
)

type fakeGameRepository struct {
	state game.GameState
	err   error
}

func (r *fakeGameRepository) SaveGame(
	ctx context.Context,
	roomID room.RoomID,
	deckID game.DeckID,
	state game.GameState,
) error {
	r.state = state
	return nil
}

func (r *fakeGameRepository) SaveGameResult(
	ctx context.Context,
	gameID game.GameID,
	result game.GameResult,
) error {
	return nil
}

func (r *fakeGameRepository) UpdateGameStatus(
	ctx context.Context,
	gameID game.GameID,
	status game.GameStatus,
) error {
	r.state.Status = status
	return nil
}

func (r *fakeGameRepository) FindGameByRoomID(
	ctx context.Context,
	roomID room.RoomID,
) (game.GameState, error) {
	if r.err != nil {
		return game.GameState{}, r.err
	}

	return r.state, nil
}

func (r *fakeGameRepository) UpdateGameState(
	ctx context.Context,
	state game.GameState,
) error {
	r.state = state
	return nil
}

func TestGetGameStateRestoresFinishedGameFromRepository(t *testing.T) {
	ctx := context.Background()
	roomID := room.RoomID("room_1")

	repository := &fakeGameRepository{
		state: game.GameState{
			ID:     game.GameID(roomID),
			Status: game.GameStatusFinished,
			Players: []game.Player{
				{ID: "player_1", Name: "Player 1"},
				{ID: "player_2", Name: "Player 2"},
			},
			Completed: map[game.PlayerID][]game.QuartetID{
				"player_1": {"quartet_1"},
				"player_2": {},
			},
			Hands: map[game.PlayerID][]game.Card{
				"player_1": {},
				"player_2": {},
			},
		},
	}

	service := NewService(nil, repository, "deck_1")

	restoredState, ok := service.GetGameState(ctx, roomID)
	if !ok {
		t.Fatal("expected game state to be restored")
	}

	if restoredState.Status != game.GameStatusFinished {
		t.Fatalf("expected finished status, got %s", restoredState.Status)
	}

	if len(restoredState.Completed["player_1"]) != 1 {
		t.Fatalf(
			"expected player_1 completed quartets to be restored, got %d",
			len(restoredState.Completed["player_1"]),
		)
	}

	result := game.CalculateGameResult(&restoredState)

	if len(result.Winners) != 1 {
		t.Fatalf("expected one winner, got %d", len(result.Winners))
	}

	if result.Winners[0] != "player_1" {
		t.Fatalf("expected winner player_1, got %s", result.Winners[0])
	}

	if result.Scores["player_1"] != 1 {
		t.Fatalf("expected player_1 score 1, got %d", result.Scores["player_1"])
	}

	if result.Scores["player_2"] != 0 {
		t.Fatalf("expected player_2 score 0, got %d", result.Scores["player_2"])
	}
}

func TestGetGameStateReturnsCachedGameBeforeRepository(t *testing.T) {
	ctx := context.Background()
	roomID := room.RoomID("room_1")

	repository := &fakeGameRepository{
		err: errors.New("repository should not be called"),
	}

	service := NewService(nil, repository, "deck_1")

	cachedState := game.GameState{
		ID:     game.GameID(roomID),
		Status: game.GameStatusPlaying,
		Players: []game.Player{
			{ID: "player_1", Name: "Player 1"},
			{ID: "player_2", Name: "Player 2"},
		},
		Completed: map[game.PlayerID][]game.QuartetID{},
		Hands: map[game.PlayerID][]game.Card{
			"player_1": {
				{ID: "card_1", QuartetID: "quartet_1", Title: "Card 1"},
			},
			"player_2": {},
		},
	}

	service.games[roomID] = cachedState

	restoredState, ok := service.GetGameState(ctx, roomID)
	if !ok {
		t.Fatal("expected cached game state")
	}

	if restoredState.Status != game.GameStatusPlaying {
		t.Fatalf("expected playing status, got %s", restoredState.Status)
	}
}

func TestGetGameStateReturnsFalseWhenRepositoryCannotFindGame(t *testing.T) {
	ctx := context.Background()
	roomID := room.RoomID("room_1")

	repository := &fakeGameRepository{
		err: errors.New("game not found"),
	}

	service := NewService(nil, repository, "deck_1")

	_, ok := service.GetGameState(ctx, roomID)
	if ok {
		t.Fatal("expected game state not to be restored")
	}
}

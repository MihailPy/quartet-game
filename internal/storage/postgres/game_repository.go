package postgres

import (
	"context"
	"database/sql"

	"github.com/MihailPy/quartet-game/internal/game"
	"github.com/MihailPy/quartet-game/internal/room"
)

type GameRepository struct {
	db *sql.DB
}

func NewGameRepository(db *sql.DB) *GameRepository {
	return &GameRepository{
		db: db,
	}
}

func (r *GameRepository) SaveGame(
	ctx context.Context,
	roomID room.RoomID,
	deckID game.DeckID,
	state game.GameState,
) error {
	_, err := r.db.ExecContext(ctx, `
		INSERT INTO games (
			id,
			room_id,
			deck_id,
			status,
			current_player_id
		)
		VALUES ($1, $2, $3, $4, $5)
	`, string(state.ID), string(roomID), string(deckID), string(state.Status), string(state.CurrentPlayerID))

	return err
}

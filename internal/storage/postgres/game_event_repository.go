package postgres

import (
	"context"
	"database/sql"
	"encoding/json"

	"github.com/MihailPy/quartet-game/internal/game"
)

type GameEventRepository struct {
	db *sql.DB
}

func NewGameEventRepository(db *sql.DB) *GameEventRepository {
	return &GameEventRepository{
		db: db,
	}
}

func (r *GameEventRepository) SaveGameEvent(
	ctx context.Context,
	event game.GameEvent,
) error {
	payloadJSON, err := json.Marshal(event.Payload)
	if err != nil {
		return err
	}

	_, err = r.db.ExecContext(
		ctx,
		`
		INSERT INTO game_events (
			id,
			game_id,
			room_id,
			type,
			actor_id,
			target_id,
			payload,
			created_at
		)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
		`,
		event.ID,
		event.GameID,
		event.RoomID,
		event.Type,
		event.ActorID,
		event.TargetID,
		payloadJSON,
		event.CreatedAt,
	)

	return err
}

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
		nullablePlayerID(event.ActorID),
		nullablePlayerID(event.TargetID),
		payloadJSON,
		event.CreatedAt,
	)

	return err
}

func (r *GameEventRepository) FindGameEventsByGameID(
	ctx context.Context,
	gameID game.GameID,
) ([]game.GameEvent, error) {
	rows, err := r.db.QueryContext(
		ctx,
		`
		SELECT id, game_id, room_id, type, actor_id, target_id, payload, created_at
		FROM game_events
		WHERE game_id = $1
		ORDER BY created_at ASC
		`,
		gameID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	events := make([]game.GameEvent, 0)

	for rows.Next() {
		var event game.GameEvent
		var payloadJSON []byte

		if err := rows.Scan(
			&event.ID,
			&event.GameID,
			&event.RoomID,
			&event.Type,
			&event.ActorID,
			&event.TargetID,
			&payloadJSON,
			&event.CreatedAt,
		); err != nil {
			return nil, err
		}

		if err := json.Unmarshal(payloadJSON, &event.Payload); err != nil {
			return nil, err
		}

		events = append(events, event)
	}

	return events, rows.Err()
}

func nullablePlayerID(playerID game.PlayerID) any {
	if playerID == "" {
		return nil
	}

	return string(playerID)
}

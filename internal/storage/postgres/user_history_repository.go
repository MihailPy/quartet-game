package postgres

import (
	"context"
	"database/sql"
	"encoding/json"

	"github.com/MihailPy/quartet-game/internal/user"
)

type UserHistoryRepository struct {
	db *sql.DB
}

func NewUserHistoryRepository(db *sql.DB) *UserHistoryRepository {
	return &UserHistoryRepository{
		db: db,
	}
}

func (r *UserHistoryRepository) SaveGameHistoryRecord(
	ctx context.Context,
	record user.GameHistoryRecord,
) error {
	playerResultsJSON, err := json.Marshal(record.PlayerResults)
	if err != nil {
		return err
	}

	_, err = r.db.ExecContext(
		ctx,
		`
		INSERT INTO user_game_history (
				id,
				game_id,
				room_id,
				user_id,
				role,
				score,
				winner_score,
				winner_player_name,
				duration_seconds,
				player_results
				is_winner,
				created_at
		)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
		`,
		record.ID,
		record.GameID,
		record.RoomID,
		record.UserID,
		record.Role,
		record.Score,
		record.WinnerScore,
		record.WinnerPlayerName,
		record.DurationSeconds,
		playerResultsJSON,
		record.IsWinner,
		record.CreatedAt,
	)

	return err
}

func (r *UserHistoryRepository) FindGameHistoryByUserID(
	ctx context.Context,
	userID user.UserID,
) ([]user.GameHistoryRecord, error) {
	rows, err := r.db.QueryContext(
		ctx,
		`
		SELECT
				id,
				game_id,
				room_id,
				user_id,
				role,
				score,
				winner_score,
				winner_player_name,
				duration_seconds,
				player_results,
				is_winner,
				created_at
		FROM user_game_history
		WHERE user_id = $1
		ORDER BY created_at DESC
		`,
		userID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	records := make([]user.GameHistoryRecord, 0)

	for rows.Next() {
		var record user.GameHistoryRecord
		var playerResultsJSON []byte

		if err := rows.Scan(
			&record.ID,
			&record.GameID,
			&record.RoomID,
			&record.UserID,
			&record.Role,
			&record.Score,
			&record.WinnerScore,
			&record.WinnerPlayerName,
			&record.DurationSeconds,
			&playerResultsJSON,
			&record.IsWinner,
			&record.CreatedAt,
		); err != nil {
			return nil, err
		}

		if err := json.Unmarshal(playerResultsJSON, &record.PlayerResults); err != nil {
			return nil, err
		}

		records = append(records, record)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return records, nil
}

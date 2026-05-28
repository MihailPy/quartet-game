package postgres

import (
	"context"
	"database/sql"
	"encoding/json"

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
	stateJSON, err := json.Marshal(state)
	if err != nil {
		return err
	}

	_, err = r.db.ExecContext(ctx, `
		INSERT INTO games (
			id,
			room_id,
			deck_id,
			status,
			current_player_id,
			state
		)
		VALUES ($1, $2, $3, $4, $5, $6)
	`, string(state.ID), string(roomID), string(deckID), string(state.Status), string(state.CurrentPlayerID), stateJSON)

	return err
}

func (r *GameRepository) SaveGameResult(
	ctx context.Context,
	gameID game.GameID,
	result game.GameResult,
) error {
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer tx.Rollback()

	for playerID, score := range result.Scores {
		isWinner := false

		for _, winnerID := range result.Winners {
			if winnerID == playerID {
				isWinner = true
				break
			}
		}

		_, err := tx.ExecContext(ctx, `
			INSERT INTO game_results (
				game_id,
				player_id,
				score,
				is_winner
			)
			VALUES ($1, $2, $3, $4)
			ON CONFLICT (game_id, player_id)
			DO UPDATE SET
				score = EXCLUDED.score,
				is_winner = EXCLUDED.is_winner
		`, string(gameID), string(playerID), score, isWinner)
		if err != nil {
			return err
		}
	}

	return tx.Commit()
}

func (r *GameRepository) UpdateGameStatus(
	ctx context.Context,
	gameID game.GameID,
	status game.GameStatus,
) error {
	_, err := r.db.ExecContext(ctx, `
		UPDATE games
		SET status = $2
		WHERE id = $1
	`, string(gameID), string(status))

	return err
}

func (r *GameRepository) FindGameByRoomID(ctx context.Context, roomID room.RoomID) (game.GameState, error) {
	var rawState []byte

	err := r.db.QueryRowContext(
		ctx,
		`
		SELECT state
		FROM games
		WHERE room_id = $1
		ORDER BY created_at DESC
		LIMIT 1
		`,
		string(roomID),
	).Scan(&rawState)
	if err != nil {
		return game.GameState{}, err
	}

	var state game.GameState
	if err := json.Unmarshal(rawState, &state); err != nil {
		return game.GameState{}, err
	}

	return state, nil
}

func (r *GameRepository) UpdateGameState(ctx context.Context, state game.GameState) error {
	stateJSON, err := json.Marshal(state)
	if err != nil {
		return err
	}

	_, err = r.db.ExecContext(
		ctx,
		`
		UPDATE games
		SET
			status = $2,
			current_player_id = $3,
			state = $4
		WHERE id = $1
		`,
		string(state.ID),
		string(state.Status),
		string(state.CurrentPlayerID),
		stateJSON,
	)

	return err
}

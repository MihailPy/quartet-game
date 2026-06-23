package postgres

import (
	"context"
	"database/sql"
	"time"

	"github.com/MihailPy/quartet-game/internal/game"
	"github.com/MihailPy/quartet-game/internal/quartet"
	"github.com/MihailPy/quartet-game/internal/user"
)

type QuartetRepository struct {
	db *sql.DB
}

func NewQuartetRepository(db *sql.DB) *QuartetRepository {
	return &QuartetRepository{
		db: db,
	}
}

func (r *QuartetRepository) CreateUserQuartet(
	ctx context.Context,
	ownerUserID user.UserID,
	newQuartet game.Quartet,
	now time.Time,
) error {
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer tx.Rollback()

	_, err = tx.ExecContext(
		ctx,
		`
		INSERT INTO quartets (id, title)
		VALUES ($1, $2)
		`,
		newQuartet.ID,
		newQuartet.Title,
	)
	if err != nil {
		return err
	}

	for _, card := range newQuartet.Cards {
		_, err = tx.ExecContext(
			ctx,
			`
			INSERT INTO cards (id, quartet_id, title)
			VALUES ($1, $2, $3)
			`,
			card.ID,
			card.QuartetID,
			card.Title,
		)
		if err != nil {
			return err
		}
	}

	_, err = tx.ExecContext(
		ctx,
		`
		INSERT INTO quartet_metadata (
			quartet_id,
			owner_user_id,
			source,
			status,
			visibility,
			created_at,
			updated_at
		)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		`,
		newQuartet.ID,
		ownerUserID,
		quartet.SourceUser,
		quartet.StatusApproved,
		quartet.VisibilityPrivate,
		now,
		now,
	)
	if err != nil {
		return err
	}

	return tx.Commit()
}

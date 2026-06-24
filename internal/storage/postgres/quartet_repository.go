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
	INSERT INTO quartets (id, deck_id, title)
	VALUES ($1, $2, $3)
	`,
		newQuartet.ID,
		game.DeckID("00000000-0000-0000-0000-000000000001"),
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

func (r *QuartetRepository) ListUserQuartets(
	ctx context.Context,
	ownerUserID user.UserID,
) ([]game.Quartet, error) {
	rows, err := r.db.QueryContext(
		ctx,
		`
		SELECT q.id, q.title
		FROM quartets q
		INNER JOIN quartet_metadata qm ON q.id = qm.quartet_id
		WHERE qm.owner_user_id = $1
		ORDER BY q.title
		`,
		ownerUserID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	quartets := make([]game.Quartet, 0)

	for rows.Next() {
		var currentQuartet game.Quartet

		if err := rows.Scan(
			&currentQuartet.ID,
			&currentQuartet.Title,
		); err != nil {
			return nil, err
		}

		cardRows, err := r.db.QueryContext(
			ctx,
			`
			SELECT id, quartet_id, title
			FROM cards
			WHERE quartet_id = $1
			ORDER BY title
			`,
			currentQuartet.ID,
		)
		if err != nil {
			return nil, err
		}

		cards := make([]game.Card, 0, 4)

		for cardRows.Next() {
			var card game.Card

			if err := cardRows.Scan(
				&card.ID,
				&card.QuartetID,
				&card.Title,
			); err != nil {
				cardRows.Close()
				return nil, err
			}

			cards = append(cards, card)
		}

		cardRows.Close()

		currentQuartet.Cards = cards
		quartets = append(quartets, currentQuartet)
	}

	return quartets, rows.Err()
}

func (r *QuartetRepository) IsUserQuartet(ctx context.Context, quartetID game.QuartetID) (bool, error) {
	var exists bool

	err := r.db.QueryRowContext(
		ctx,
		`
		SELECT EXISTS (
			SELECT 1
			FROM quartet_metadata
			WHERE quartet_id = $1
			  AND source = 'user'
		)
		`,
		quartetID,
	).Scan(&exists)

	if err != nil {
		return false, err
	}

	return exists, nil
}

func (r *QuartetRepository) DeleteUserQuartet(
	ctx context.Context,
	ownerUserID user.UserID,
	quartetID game.QuartetID,
) error {
	_, err := r.db.ExecContext(
		ctx,
		`
		DELETE FROM quartets
		WHERE id = $1
		  AND EXISTS (
			SELECT 1
			FROM quartet_metadata
			WHERE quartet_id = $1
			  AND owner_user_id = $2
		  )
		`,
		quartetID,
		ownerUserID,
	)

	return err
}

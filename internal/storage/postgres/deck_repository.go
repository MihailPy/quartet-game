package postgres

import (
	"context"
	"database/sql"
	"errors"

	"github.com/MihailPy/quartet-game/internal/game"
)

var ErrDeckNotFound = errors.New("deck not found")

type DeckRepository struct {
	db *sql.DB
}

func NewDeckRepository(db *sql.DB) *DeckRepository {
	return &DeckRepository{
		db: db,
	}
}

func (r *DeckRepository) FindByID(ctx context.Context, deckID game.DeckID) (game.Deck, error) {
	rows, err := r.db.QueryContext(ctx, `
		SELECT
			d.id,
			d.title,
			q.id,
			q.title,
			c.id,
			c.title
		FROM decks d
		JOIN quartets q ON q.deck_id = d.id
		JOIN cards c ON c.quartet_id = q.id
		WHERE d.id = $1
		ORDER BY q.title, c.title
	`, string(deckID))
	if err != nil {
		return game.Deck{}, err
	}
	defer rows.Close()

	var deckTitle string
	quartetsByID := make(map[game.QuartetID]*game.Quartet)

	for rows.Next() {
		var (
			dbDeckID       string
			dbDeckTitle    string
			dbQuartetID    string
			dbQuartetTitle string
			dbCardID       string
			dbCardTitle    string
		)

		if err := rows.Scan(
			&dbDeckID,
			&dbDeckTitle,
			&dbQuartetID,
			&dbQuartetTitle,
			&dbCardID,
			&dbCardTitle,
		); err != nil {
			return game.Deck{}, err
		}

		deckTitle = dbDeckTitle

		quartetID := game.QuartetID(dbQuartetID)

		if quartetsByID[quartetID] == nil {
			quartetsByID[quartetID] = &game.Quartet{
				ID:    quartetID,
				Title: dbQuartetTitle,
				Cards: []game.Card{},
			}
		}

		quartetsByID[quartetID].Cards = append(quartetsByID[quartetID].Cards, game.Card{
			ID:        game.CardID(dbCardID),
			QuartetID: quartetID,
			Title:     dbCardTitle,
		})
	}

	if err := rows.Err(); err != nil {
		return game.Deck{}, err
	}

	if deckTitle == "" {
		return game.Deck{}, ErrDeckNotFound
	}

	quartets := make([]game.Quartet, 0, len(quartetsByID))
	for _, quartet := range quartetsByID {
		quartets = append(quartets, *quartet)
	}

	return game.Deck{
		ID:       deckID,
		Title:    deckTitle,
		Quartets: quartets,
	}, nil
}

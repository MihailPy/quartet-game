package game

import "errors"

var ErrInvalidCard = errors.New("invalid card")

type CardID string
type QuartetID string

type Card struct {
	ID        CardID
	QuartetID QuartetID
	Title     string
}

func NewCard(id CardID, quartetID QuartetID, title string) (Card, error) {
	if id == "" {
		return Card{}, ErrInvalidCard
	}

	if quartetID == "" {
		return Card{}, ErrInvalidCard
	}

	if title == "" {
		return Card{}, ErrInvalidCard
	}

	return Card{
		ID:        id,
		QuartetID: quartetID,
		Title:     title,
	}, nil
}

var ErrInvalidQuartet = errors.New("invalid quartet")

type Quartet struct {
	ID    QuartetID
	Title string
	Cards []Card
}

func NewQuartet(id QuartetID, title string, cards []Card) (Quartet, error) {
	if id == "" {
		return Quartet{}, ErrInvalidQuartet
	}

	if title == "" {
		return Quartet{}, ErrInvalidQuartet
	}

	if len(cards) != 4 {
		return Quartet{}, ErrInvalidQuartet
	}

	for _, card := range cards {
		if card.QuartetID != id {
			return Quartet{}, ErrInvalidQuartet
		}
	}

	return Quartet{
		ID:    id,
		Title: title,
		Cards: cards,
	}, nil
}

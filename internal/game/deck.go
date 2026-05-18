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

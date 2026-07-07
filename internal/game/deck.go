package game

import "errors"

var ErrInvalidCard = errors.New("invalid card")

type CardID string
type QuartetID string

type Card struct {
	ID        CardID
	QuartetID QuartetID
	Title     string
	ImageURL  string
}

func NewCard(id CardID, quartetID QuartetID, title string, imageURL string) (Card, error) {
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
		ImageURL:  imageURL,
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

var ErrInvalidDeck = errors.New("invalid deck")

type DeckID string

type Deck struct {
	ID       DeckID
	Title    string
	Quartets []Quartet
}

func NewDeck(id DeckID, title string, quartets []Quartet) (Deck, error) {
	if id == "" {
		return Deck{}, ErrInvalidDeck
	}

	if title == "" {
		return Deck{}, ErrInvalidDeck
	}

	if len(quartets) == 0 {
		return Deck{}, ErrInvalidDeck
	}

	return Deck{
		ID:       id,
		Title:    title,
		Quartets: quartets,
	}, nil
}

func (d Deck) Cards() []Card {
	cards := make([]Card, 0, len(d.Quartets)*4)

	for _, quartet := range d.Quartets {
		cards = append(cards, quartet.Cards...)
	}

	return cards
}

var ErrCardNotFound = errors.New("card not found")

func (d Deck) FindCard(cardID CardID) (Card, error) {
	if cardID == "" {
		return Card{}, ErrCardNotFound
	}

	for _, card := range d.Cards() {
		if card.ID == cardID {
			return card, nil
		}
	}

	return Card{}, ErrCardNotFound
}

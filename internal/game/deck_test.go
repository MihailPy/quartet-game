package game

import "testing"

func TestNewCard(t *testing.T) {
	card, err := NewCard("card_1", "quartet_1", "Boeing 747")
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}

	if card.ID != "card_1" {
		t.Fatalf("expected card ID card_1, got %s", card.ID)
	}

	if card.QuartetID != "quartet_1" {
		t.Fatalf("expected quartet ID quartet_1, got %s", card.QuartetID)
	}

	if card.Title != "Boeing 747" {
		t.Fatalf("expected title Boeing 747, got %s", card.Title)
	}
}

func TestNewCardInvalid(t *testing.T) {
	tests := []struct {
		name      string
		id        CardID
		quartetID QuartetID
		title     string
	}{
		{
			name:      "empty id",
			id:        "",
			quartetID: "quartet_1",
			title:     "Boeing 747",
		},
		{
			name:      "empty quartet id",
			id:        "card_1",
			quartetID: "",
			title:     "Boeing 747",
		},
		{
			name:      "empty title",
			id:        "card_1",
			quartetID: "quartet_1",
			title:     "",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			_, err := NewCard(tt.id, tt.quartetID, tt.title)
			if err == nil {
				t.Fatal("expected error, got nil")
			}
		})
	}
}

func TestNewQuartet(t *testing.T) {
	cards := []Card{
		{ID: "card_1", QuartetID: "quartet_1", Title: "Boeing 747"},
		{ID: "card_2", QuartetID: "quartet_1", Title: "Airbus A380"},
		{ID: "card_3", QuartetID: "quartet_1", Title: "Concorde"},
		{ID: "card_4", QuartetID: "quartet_1", Title: "Ан-225"},
	}

	quartet, err := NewQuartet("quartet_1", "Самолёты", cards)
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}

	if quartet.ID != "quartet_1" {
		t.Fatalf("expected quartet ID quartet_1, got %s", quartet.ID)
	}

	if quartet.Title != "Самолёты" {
		t.Fatalf("expected title Самолёты, got %s", quartet.Title)
	}

	if len(quartet.Cards) != 4 {
		t.Fatalf("expected 4 cards, got %d", len(quartet.Cards))
	}
}

func TestNewQuartetInvalid(t *testing.T) {
	validCards := []Card{
		{ID: "card_1", QuartetID: "quartet_1", Title: "Boeing 747"},
		{ID: "card_2", QuartetID: "quartet_1", Title: "Airbus A380"},
		{ID: "card_3", QuartetID: "quartet_1", Title: "Concorde"},
		{ID: "card_4", QuartetID: "quartet_1", Title: "Ан-225"},
	}

	tests := []struct {
		name  string
		id    QuartetID
		title string
		cards []Card
	}{
		{
			name:  "empty id",
			id:    "",
			title: "Самолёты",
			cards: validCards,
		},
		{
			name:  "empty title",
			id:    "quartet_1",
			title: "",
			cards: validCards,
		},
		{
			name:  "less than 4 cards",
			id:    "quartet_1",
			title: "Самолёты",
			cards: validCards[:3],
		},
		{
			name:  "more than 4 cards",
			id:    "quartet_1",
			title: "Самолёты",
			cards: append(validCards, Card{ID: "card_5", QuartetID: "quartet_1", Title: "Extra"}),
		},
		{
			name:  "card from another quartet",
			id:    "quartet_1",
			title: "Самолёты",
			cards: []Card{
				{ID: "card_1", QuartetID: "quartet_1", Title: "Boeing 747"},
				{ID: "card_2", QuartetID: "quartet_1", Title: "Airbus A380"},
				{ID: "card_3", QuartetID: "quartet_1", Title: "Concorde"},
				{ID: "card_4", QuartetID: "quartet_2", Title: "Ан-225"},
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			_, err := NewQuartet(tt.id, tt.title, tt.cards)
			if err == nil {
				t.Fatal("expected error, got nil")
			}
		})
	}
}

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

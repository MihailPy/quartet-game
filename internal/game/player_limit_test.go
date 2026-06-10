package game

import "testing"

func TestMaxPlayersForCardCount(t *testing.T) {
	tests := []struct {
		name      string
		cardCount int
		expected  int
	}{
		{
			name:      "zero cards",
			cardCount: 0,
			expected:  0,
		},
		{
			name:      "one quartet",
			cardCount: 4,
			expected:  2,
		},
		{
			name:      "two quartets",
			cardCount: 8,
			expected:  4,
		},
		{
			name:      "four quartets",
			cardCount: 16,
			expected:  8,
		},
		{
			name:      "odd card count",
			cardCount: 9,
			expected:  4,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			actual := MaxPlayersForCardCount(tt.cardCount)

			if actual != tt.expected {
				t.Fatalf("expected %d, got %d", tt.expected, actual)
			}
		})
	}
}

func TestMaxPlayersForDeck(t *testing.T) {
	deck := testDeck()

	actual := MaxPlayersForDeck(deck)

	if actual != len(deck.Cards())/MinCardsPerPlayer {
		t.Fatalf("expected %d, got %d", len(deck.Cards())/MinCardsPerPlayer, actual)
	}
}

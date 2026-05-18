package game

import "testing"

func TestShuffleCardsKeepsSameAmount(t *testing.T) {
	cards := testDeck().Cards()

	shuffled := ShuffleCards(cards)

	if len(shuffled) != len(cards) {
		t.Fatalf("expected %d cards, got %d", len(cards), len(shuffled))
	}
}

func TestShuffleCardsKeepsSameCards(t *testing.T) {
	cards := testDeck().Cards()

	shuffled := ShuffleCards(cards)

	originalCards := make(map[CardID]bool)

	for _, card := range cards {
		originalCards[card.ID] = true
	}

	for _, card := range shuffled {
		if !originalCards[card.ID] {
			t.Fatalf("unexpected card after shuffle: %s", card.ID)
		}
	}
}

func TestShuffleCardsDoesNotModifyOriginalSlice(t *testing.T) {
	cards := testDeck().Cards()

	originalFirstCard := cards[0]

	_ = ShuffleCards(cards)

	if cards[0] != originalFirstCard {
		t.Fatal("expected original slice to stay unchanged")
	}
}

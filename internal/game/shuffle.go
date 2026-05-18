package game

import (
	"math/rand"
	"time"
)

func ShuffleCards(cards []Card) []Card {
	shuffled := make([]Card, len(cards))
	copy(shuffled, cards)

	r := rand.New(rand.NewSource(time.Now().UnixNano()))

	r.Shuffle(len(shuffled), func(i, j int) {
		shuffled[i], shuffled[j] = shuffled[j], shuffled[i]
	})

	return shuffled
}

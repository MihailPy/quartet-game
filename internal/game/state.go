package game

import (
	"errors"
	"time"
)

var ErrInvalidGameState = errors.New("invalid game state")

type GameID string

type GameStatus string

const (
	GameStatusWaiting  GameStatus = "waiting"
	GameStatusPlaying  GameStatus = "playing"
	GameStatusFinished GameStatus = "finished"
)

type GameState struct {
	ID              GameID
	Deck            Deck
	Players         []Player
	Status          GameStatus
	CurrentPlayerID PlayerID
	Hands           map[PlayerID][]Card
	Completed       map[PlayerID][]QuartetID
	StartedAt       time.Time
}

func NewGameState(id GameID, deck Deck, players []Player) (GameState, error) {
	if id == "" {
		return GameState{}, ErrInvalidGameState
	}

	if deck.ID == "" {
		return GameState{}, ErrInvalidGameState
	}

	if len(players) < 2 {
		return GameState{}, ErrInvalidGameState
	}

	hands := make(map[PlayerID][]Card, len(players))
	completed := make(map[PlayerID][]QuartetID, len(players))

	for _, player := range players {
		if player.ID == "" {
			return GameState{}, ErrInvalidGameState
		}

		hands[player.ID] = []Card{}
		completed[player.ID] = []QuartetID{}
	}

	return GameState{
		ID:        id,
		Deck:      deck,
		Players:   players,
		Status:    GameStatusWaiting,
		Hands:     hands,
		Completed: completed,
	}, nil
}

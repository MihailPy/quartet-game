package game

import "errors"

var ErrInvalidPlayer = errors.New("invalid player")

type PlayerID string

type Player struct {
	ID   PlayerID
	Name string
}

func NewPlayer(id PlayerID, name string) (Player, error) {
	if id == "" {
		return Player{}, ErrInvalidPlayer
	}

	if name == "" {
		return Player{}, ErrInvalidPlayer
	}

	return Player{
		ID:   id,
		Name: name,
	}, nil
}

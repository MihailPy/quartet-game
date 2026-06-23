package user

import (
	"errors"
	"time"
)

type UserID string

var ErrInvalidUser = errors.New("invalid user")

type User struct {
	ID           UserID    `json:"id"`
	PlayerName   string    `json:"player_name"`
	RecoveryCode string    `json:"recovery_code"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

func NewUser(id UserID, playerName string, recoveryCode string, now time.Time) (User, error) {
	if id == "" || playerName == "" || recoveryCode == "" {
		return User{}, ErrInvalidUser
	}

	return User{
		ID:           id,
		PlayerName:   playerName,
		RecoveryCode: recoveryCode,
		CreatedAt:    now,
		UpdatedAt:    now,
	}, nil
}

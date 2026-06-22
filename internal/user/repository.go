package user

import (
	"context"
	"errors"
	"sync"
	"time"
)

var ErrUserNotFound = errors.New("user not found")

type Repository interface {
	SaveUser(ctx context.Context, currentUser User) error
	FindUserByID(ctx context.Context, userID UserID) (User, error)
	UpdatePlayerName(ctx context.Context, userID UserID, playerName string) (User, error)
}

type MemoryRepository struct {
	mu    sync.RWMutex
	users map[UserID]User
}

func NewMemoryRepository() *MemoryRepository {
	return &MemoryRepository{
		users: make(map[UserID]User),
	}
}

func (r *MemoryRepository) SaveUser(ctx context.Context, currentUser User) error {
	_ = ctx

	r.mu.Lock()
	defer r.mu.Unlock()

	r.users[currentUser.ID] = currentUser

	return nil
}

func (r *MemoryRepository) FindUserByID(ctx context.Context, userID UserID) (User, error) {
	_ = ctx

	r.mu.RLock()
	defer r.mu.RUnlock()

	currentUser, ok := r.users[userID]
	if !ok {
		return User{}, ErrUserNotFound
	}

	return currentUser, nil
}

func (r *MemoryRepository) UpdatePlayerName(ctx context.Context, userID UserID, playerName string, now time.Time) (User, error) {
	_ = ctx

	r.mu.Lock()
	defer r.mu.Unlock()

	currentUser, ok := r.users[userID]
	if !ok {
		return User{}, ErrUserNotFound
	}

	currentUser.PlayerName = playerName
	currentUser.UpdatedAt = now

	r.users[userID] = currentUser

	return currentUser, nil
}

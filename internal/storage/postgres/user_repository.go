package postgres

import (
	"context"
	"database/sql"
	"errors"
	"time"

	"github.com/MihailPy/quartet-game/internal/user"
)

type UserRepository struct {
	db *sql.DB
}

func NewUserRepository(db *sql.DB) *UserRepository {
	return &UserRepository{
		db: db,
	}
}

func (r *UserRepository) SaveUser(ctx context.Context, currentUser user.User) error {
	_, err := r.db.ExecContext(
		ctx,
		`
		INSERT INTO users (id, player_name, recovery_code, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5)
		`,
		currentUser.ID,
		currentUser.PlayerName,
		currentUser.RecoveryCode,
		currentUser.CreatedAt,
		currentUser.UpdatedAt,
	)

	return err
}

func (r *UserRepository) FindUserByID(ctx context.Context, userID user.UserID) (user.User, error) {
	var currentUser user.User

	err := r.db.QueryRowContext(
		ctx,
		`
		SELECT id, player_name, recovery_code, created_at, updated_at
		FROM users
		WHERE id = $1
		`,
		userID,
	).Scan(
		&currentUser.ID,
		&currentUser.PlayerName,
		&currentUser.RecoveryCode,
		&currentUser.CreatedAt,
		&currentUser.UpdatedAt,
	)

	if errors.Is(err, sql.ErrNoRows) {
		return user.User{}, user.ErrUserNotFound
	}

	if err != nil {
		return user.User{}, err
	}

	return currentUser, nil
}

func (r *UserRepository) UpdatePlayerName(
	ctx context.Context,
	userID user.UserID,
	playerName string,
	now time.Time,
) (user.User, error) {
	var updatedUser user.User

	err := r.db.QueryRowContext(
		ctx,
		`
		UPDATE users
		SET player_name = $2,
		    updated_at = $3
		WHERE id = $1
		RETURNING id, player_name, recovery_code, created_at, updated_at
		`,
		userID,
		playerName,
		now,
	).Scan(
		&updatedUser.ID,
		&updatedUser.PlayerName,
		&updatedUser.RecoveryCode,
		&updatedUser.CreatedAt,
		&updatedUser.UpdatedAt,
	)

	if errors.Is(err, sql.ErrNoRows) {
		return user.User{}, user.ErrUserNotFound
	}

	if err != nil {
		return user.User{}, err
	}

	return updatedUser, nil
}

func (r *UserRepository) SaveGameHistoryRecord(
	ctx context.Context,
	record user.GameHistoryRecord,
) error {
	historyRepository := NewUserHistoryRepository(r.db)

	return historyRepository.SaveGameHistoryRecord(ctx, record)
}

func (r *UserRepository) FindGameHistoryByUserID(
	ctx context.Context,
	userID user.UserID,
) ([]user.GameHistoryRecord, error) {
	historyRepository := NewUserHistoryRepository(r.db)

	return historyRepository.FindGameHistoryByUserID(ctx, userID)
}

func (r *UserRepository) FindUserByRecoveryCode(
	ctx context.Context,
	recoveryCode string,
) (user.User, error) {
	var currentUser user.User

	err := r.db.QueryRowContext(
		ctx,
		`
		SELECT id, player_name, recovery_code, created_at, updated_at
		FROM users
		WHERE recovery_code = $1
		`,
		recoveryCode,
	).Scan(
		&currentUser.ID,
		&currentUser.PlayerName,
		&currentUser.RecoveryCode,
		&currentUser.CreatedAt,
		&currentUser.UpdatedAt,
	)

	if errors.Is(err, sql.ErrNoRows) {
		return user.User{}, user.ErrUserNotFound
	}

	if err != nil {
		return user.User{}, err
	}

	return currentUser, nil
}

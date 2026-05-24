package postgres

import (
	"context"
	"database/sql"

	"github.com/MihailPy/quartet-game/internal/room"
)

type RoomRepository struct {
	db *sql.DB
}

func NewRoomRepository(db *sql.DB) *RoomRepository {
	return &RoomRepository{
		db: db,
	}
}

func (r *RoomRepository) SaveRoom(ctx context.Context, currentRoom room.Room) error {
	_, err := r.db.ExecContext(ctx, `
		INSERT INTO rooms (id, status)
		VALUES ($1, $2)
	`, string(currentRoom.ID), string(currentRoom.Status))

	return err
}

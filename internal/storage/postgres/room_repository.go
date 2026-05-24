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

func (r *RoomRepository) SaveRoomPlayer(ctx context.Context, roomID room.RoomID, player room.Player) error {
	_, err := r.db.ExecContext(ctx, `
		INSERT INTO room_players (
			room_id,
			player_id,
			name,
			is_ready,
			is_connected
		)
		VALUES ($1, $2, $3, $4, $5)
	`, string(roomID), string(player.ID), player.Name, player.IsReady, player.IsConnected)

	return err
}

func (r *RoomRepository) UpdateRoomPlayerReady(
	ctx context.Context,
	roomID room.RoomID,
	playerID room.PlayerID,
	isReady bool,
) error {
	_, err := r.db.ExecContext(ctx, `
		UPDATE room_players
		SET is_ready = $3
		WHERE room_id = $1 AND player_id = $2
	`, string(roomID), string(playerID), isReady)

	return err
}

func (r *RoomRepository) UpdateRoomStatus(
	ctx context.Context,
	roomID room.RoomID,
	status room.RoomStatus,
) error {
	_, err := r.db.ExecContext(ctx, `
		UPDATE rooms
		SET status = $2
		WHERE id = $1
	`, string(roomID), string(status))

	return err
}

func (r *RoomRepository) UpdateRoomPlayerConnected(
	ctx context.Context,
	roomID room.RoomID,
	playerID room.PlayerID,
	isConnected bool,
) error {
	_, err := r.db.ExecContext(ctx, `
		UPDATE room_players
		SET is_connected = $3
		WHERE room_id = $1 AND player_id = $2
	`, string(roomID), string(playerID), isConnected)

	return err
}

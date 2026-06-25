package user

import "time"

type GameHistoryRecord struct {
	ID               string    `json:"id"`
	GameID           string    `json:"game_id"`
	RoomID           string    `json:"room_id"`
	UserID           UserID    `json:"user_id"`
	Role             string    `json:"role"`
	Score            int       `json:"score"`
	WinnerScore      int       `json:"winner_score"`
	WinnerPlayerName string    `json:"winner_player_name"`
	IsWinner         bool      `json:"is_winner"`
	CreatedAt        time.Time `json:"created_at"`
}

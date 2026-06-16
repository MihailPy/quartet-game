package room

type RoomID string
type RoomStatus string
type PlayerID string

const (
	RoomStatusWaiting RoomStatus = "waiting"
	RoomStatusPlaying RoomStatus = "playing"
)

type Player struct {
	ID          PlayerID `json:"id"`
	Name        string   `json:"name"`
	IsReady     bool     `json:"is_ready"`
	IsConnected bool     `json:"is_connected"`
}

type Room struct {
	ID                RoomID            `json:"id"`
	Status            RoomStatus        `json:"status"`
	Players           []Player          `json:"players"`
	OwnerPlayerID     PlayerID          `json:"owner_player_id"`
	SelectedPlayerIDs map[PlayerID]bool `json:"selected_player_ids"`
}

package room

type RoomID string
type RoomStatus string
type PlayerID string

const (
	RoomStatusWaiting RoomStatus = "waiting"
	RoomStatusPlaying RoomStatus = "playing"
)

type Player struct {
	ID   PlayerID `json:"id"`
	Name string   `json:"name"`
}

type Room struct {
	ID      RoomID     `json:"id"`
	Status  RoomStatus `json:"status"`
	Players []Player   `json:"players"`
}

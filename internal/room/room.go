package room

type RoomID string
type RoomStatus string

const (
	RoomStatusWaiting RoomStatus = "waiting"
	RoomStatusPlaying RoomStatus = "playing"
)

type Room struct {
	ID     RoomID     `json:"id"`
	Status RoomStatus `json:"status"`
}

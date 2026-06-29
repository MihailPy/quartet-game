package game

import "time"

type GameEventType string

const (
	GameEventTypeGameStarted          GameEventType = "game_started"
	GameEventTypeCardRequested        GameEventType = "card_requested"
	GameEventTypeCardRequestSucceeded GameEventType = "card_request_succeeded"
	GameEventTypeCardRequestFailed    GameEventType = "card_request_failed"
	GameEventTypeQuartetCompleted     GameEventType = "quartet_completed"
	GameEventTypeTurnChanged          GameEventType = "turn_changed"
	GameEventTypeGameFinished         GameEventType = "game_finished"
)

type GameEvent struct {
	ID        string
	GameID    GameID
	RoomID    string
	Type      GameEventType
	ActorID   PlayerID
	TargetID  PlayerID
	Payload   map[string]any
	CreatedAt time.Time
}

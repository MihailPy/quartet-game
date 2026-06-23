package quartet

import (
	"time"

	"github.com/MihailPy/quartet-game/internal/game"
	"github.com/MihailPy/quartet-game/internal/user"
)

type Source string
type Status string
type Visibility string

const (
	SourceOfficial Source = "official"
	SourceUser     Source = "user"
)

const (
	StatusDraft    Status = "draft"
	StatusApproved Status = "approved"
	StatusRejected Status = "rejected"
)

const (
	VisibilityPrivate Visibility = "private"
	VisibilityPublic  Visibility = "public"
)

type Metadata struct {
	QuartetID   game.QuartetID
	OwnerUserID *user.UserID
	Source      Source
	Status      Status
	Visibility  Visibility
	CreatedAt   time.Time
	UpdatedAt   time.Time
}

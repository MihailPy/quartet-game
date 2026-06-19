package deck

import (
	"context"

	"github.com/MihailPy/quartet-game/internal/game"
	"github.com/MihailPy/quartet-game/internal/room"
)

type Repository interface {
	FindByID(ctx context.Context, deckID game.DeckID) (game.Deck, error)
}

type Service struct {
	repository Repository
}

func NewService(repository Repository) *Service {
	return &Service{
		repository: repository,
	}
}

func (s *Service) LoadDeck(ctx context.Context, deckID game.DeckID) (game.Deck, error) {
	return s.repository.FindByID(ctx, deckID)
}

func (s *Service) LoadAvailableQuartets(ctx context.Context, ownerPlayerID room.PlayerID) ([]game.Quartet, error) {
	_ = ownerPlayerID

	loadedDeck, err := s.LoadDeck(ctx, game.DeckID("default"))
	if err != nil {
		return nil, err
	}

	return loadedDeck.Quartets, nil
}

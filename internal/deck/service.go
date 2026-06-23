package deck

import (
	"context"

	"github.com/MihailPy/quartet-game/internal/game"
	"github.com/MihailPy/quartet-game/internal/room"
	"github.com/MihailPy/quartet-game/internal/user"
)

type Repository interface {
	FindByID(ctx context.Context, deckID game.DeckID) (game.Deck, error)
}

type QuartetRepository interface {
	ListUserQuartets(ctx context.Context, ownerUserID user.UserID) ([]game.Quartet, error)
	IsUserQuartet(ctx context.Context, quartetID game.QuartetID) (bool, error)
}

type Service struct {
	repository        Repository
	quartetRepository QuartetRepository
}

func NewService(repository Repository, quartetRepository QuartetRepository) *Service {
	return &Service{
		repository:        repository,
		quartetRepository: quartetRepository,
	}
}

func (s *Service) LoadDeck(ctx context.Context, deckID game.DeckID) (game.Deck, error) {
	return s.repository.FindByID(ctx, deckID)
}

func (s *Service) LoadAvailableQuartets(
	ctx context.Context,
	ownerPlayerID room.PlayerID,
	ownerUserID user.UserID,
) ([]game.Quartet, error) {
	_ = ownerPlayerID

	loadedDeck, err := s.LoadDeck(ctx, game.DeckID("00000000-0000-0000-0000-000000000001"))
	if err != nil {
		return nil, err
	}

	quartets := make([]game.Quartet, 0, len(loadedDeck.Quartets))

	for _, currentQuartet := range loadedDeck.Quartets {
		if s.quartetRepository != nil && ownerUserID != "" {
			isUserQuartet, err := s.quartetRepository.IsUserQuartet(ctx, currentQuartet.ID)
			if err != nil {
				return nil, err
			}

			if isUserQuartet {
				continue
			}
		}

		quartets = append(quartets, currentQuartet)
	}

	if ownerUserID != "" && s.quartetRepository != nil {
		userQuartets, err := s.quartetRepository.ListUserQuartets(ctx, ownerUserID)
		if err != nil {
			return nil, err
		}

		quartets = append(quartets, userQuartets...)
	}

	return quartets, nil
}

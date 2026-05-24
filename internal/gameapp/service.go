package gameapp

import (
	"context"
	"errors"

	"github.com/MihailPy/quartet-game/internal/game"
	"github.com/MihailPy/quartet-game/internal/room"
)

var ErrCannotStartGame = errors.New("cannot start game")

type DeckService interface {
	LoadDeck(ctx context.Context, deckID game.DeckID) (game.Deck, error)
}

type Service struct {
	deckService DeckService
	deckID      game.DeckID
	games       map[room.RoomID]game.GameState
}

func NewService(deckService DeckService, deckID game.DeckID) *Service {
	return &Service{
		deckService: deckService,
		deckID:      deckID,
		games:       make(map[room.RoomID]game.GameState),
	}
}

func (s *Service) StartGame(ctx context.Context, currentRoom room.Room) (game.GameState, error) {
	loadedDeck, err := s.deckService.LoadDeck(ctx, s.deckID)
	if err != nil {
		return game.GameState{}, err
	}

	players := make([]game.Player, 0, len(currentRoom.Players))
	for _, roomPlayer := range currentRoom.Players {
		players = append(players, game.Player{
			ID:   game.PlayerID(roomPlayer.ID),
			Name: roomPlayer.Name,
		})
	}

	state, err := game.NewGame(
		game.GameID(currentRoom.ID),
		loadedDeck,
		players,
	)
	if err != nil {
		return game.GameState{}, ErrCannotStartGame
	}

	cards := game.ShuffleCards(loadedDeck.Cards())

	if err := game.DealCards(&state, cards); err != nil {
		return game.GameState{}, err
	}

	game.CheckAllCompletedQuartets(&state)

	if err := game.ChooseFirstPlayer(&state); err != nil {
		return game.GameState{}, err
	}

	state.Status = game.GameStatusPlaying

	s.games[currentRoom.ID] = state

	return state, nil
}

func (s *Service) GetGame(roomID room.RoomID) (game.GameState, bool) {
	state, ok := s.games[roomID]
	return state, ok
}

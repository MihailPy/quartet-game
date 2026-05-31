package gameapp

import (
	"context"
	"errors"
	"sync"

	"github.com/MihailPy/quartet-game/internal/game"
	"github.com/MihailPy/quartet-game/internal/room"
)

var ErrCannotStartGame = errors.New("cannot start game")

type GameRepository interface {
	SaveGame(ctx context.Context, roomID room.RoomID, deckID game.DeckID, state game.GameState) error
	SaveGameResult(ctx context.Context, gameID game.GameID, result game.GameResult) error
	UpdateGameStatus(ctx context.Context, gameID game.GameID, status game.GameStatus) error
	FindGameByRoomID(ctx context.Context, roomID room.RoomID) (game.GameState, error)
	UpdateGameState(ctx context.Context, state game.GameState) error
}

type DeckService interface {
	LoadDeck(ctx context.Context, deckID game.DeckID) (game.Deck, error)
}

type Service struct {
	mu             sync.Mutex
	deckService    DeckService
	gameRepository GameRepository
	deckID         game.DeckID
	games          map[room.RoomID]game.GameState
}

func NewService(
	deckService DeckService,
	gameRepository GameRepository,
	deckID game.DeckID,
) *Service {
	return &Service{
		deckService:    deckService,
		gameRepository: gameRepository,
		deckID:         deckID,
		games:          make(map[room.RoomID]game.GameState),
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

	if s.gameRepository != nil {
		if err := s.gameRepository.SaveGame(ctx, currentRoom.ID, s.deckID, state); err != nil {
			return game.GameState{}, err
		}
	}

	s.mu.Lock()
	s.games[currentRoom.ID] = state
	s.mu.Unlock()

	return state, nil
}

func (s *Service) GetGame(roomID room.RoomID) (game.GameState, bool) {
	s.mu.Lock()
	defer s.mu.Unlock()

	state, ok := s.games[roomID]
	return state, ok
}

func (s *Service) FinishGame(ctx context.Context, roomID room.RoomID) (game.GameResult, error) {
	s.mu.Lock()
	state, ok := s.games[roomID]
	s.mu.Unlock()

	if !ok {
		return game.GameResult{}, ErrCannotStartGame
	}

	game.FinishGame(&state)

	if state.Status != game.GameStatusFinished {
		return game.GameResult{}, ErrCannotStartGame
	}

	result := game.CalculateGameResult(&state)

	if s.gameRepository != nil {
		if err := s.gameRepository.SaveGameResult(ctx, state.ID, result); err != nil {
			return game.GameResult{}, err
		}
	}

	s.mu.Lock()
	s.games[roomID] = state
	s.mu.Unlock()

	return result, nil
}

func (s *Service) RequestCard(
	ctx context.Context,
	roomID room.RoomID,
	actorID room.PlayerID,
	targetPlayerID room.PlayerID,
	cardID game.CardID,
) (game.RequestCardResult, game.GameState, error) {
	s.mu.Lock()
	state, ok := s.games[roomID]
	s.mu.Unlock()

	if !ok {
		return game.RequestCardResult{}, game.GameState{}, ErrCannotStartGame
	}

	command, err := game.NewRequestCardCommand(
		game.PlayerID(actorID),
		game.PlayerID(targetPlayerID),
		cardID,
	)
	if err != nil {
		return game.RequestCardResult{}, game.GameState{}, err
	}

	result, err := game.RequestCard(&state, command)
	if err != nil {
		return game.RequestCardResult{}, game.GameState{}, err
	}

	if state.Status == game.GameStatusFinished && s.gameRepository != nil {
		gameResult := game.CalculateGameResult(&state)

		if err := s.gameRepository.SaveGameResult(ctx, state.ID, gameResult); err != nil {
			return game.RequestCardResult{}, game.GameState{}, err
		}

		if err := s.gameRepository.UpdateGameStatus(ctx, state.ID, state.Status); err != nil {
			return game.RequestCardResult{}, game.GameState{}, err
		}
	}

	s.mu.Lock()
	s.games[roomID] = state
	s.mu.Unlock()

	if err := s.gameRepository.UpdateGameState(ctx, state); err != nil {
		return game.RequestCardResult{}, game.GameState{}, err
	}

	return result, state, nil
}

func (s *Service) GetGameState(ctx context.Context, roomID room.RoomID) (game.GameState, bool) {
	s.mu.Lock()
	state, ok := s.games[roomID]
	s.mu.Unlock()

	if ok {
		return state, true
	}

	state, err := s.gameRepository.FindGameByRoomID(ctx, roomID)
	if err != nil {
		return game.GameState{}, false
	}

	s.mu.Lock()
	s.games[roomID] = state
	s.mu.Unlock()

	return state, true
}

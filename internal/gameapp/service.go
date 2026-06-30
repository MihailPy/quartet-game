package gameapp

import (
	"context"
	"errors"
	"sync"
	"time"

	"github.com/MihailPy/quartet-game/internal/game"
	"github.com/MihailPy/quartet-game/internal/room"
	"github.com/MihailPy/quartet-game/internal/user"
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

type UserHistoryRepository interface {
	SaveGameHistoryRecord(ctx context.Context, record user.GameHistoryRecord) error
}

type GameEventRepository interface {
	SaveGameEvent(ctx context.Context, event game.GameEvent) error
	FindGameEventsByGameID(ctx context.Context, gameID game.GameID) ([]game.GameEvent, error)
}

type Service struct {
	mu                    sync.Mutex
	deckService           DeckService
	gameRepository        GameRepository
	userHistoryRepository UserHistoryRepository
	gameEventRepository   GameEventRepository
	deckID                game.DeckID
	games                 map[room.RoomID]game.GameState
	rooms                 map[room.RoomID]room.Room
}

func NewService(
	deckService DeckService,
	gameRepository GameRepository,
	userHistoryRepository UserHistoryRepository,
	gameEventRepository GameEventRepository,
	deckID game.DeckID,
) *Service {
	return &Service{
		deckService:           deckService,
		gameRepository:        gameRepository,
		userHistoryRepository: userHistoryRepository,
		gameEventRepository:   gameEventRepository,
		deckID:                deckID,
		games:                 make(map[room.RoomID]game.GameState),
		rooms:                 make(map[room.RoomID]room.Room),
	}
}

func (s *Service) StartGame(ctx context.Context, currentRoom room.Room) (game.GameState, error) {
	loadedDeck, err := s.deckService.LoadDeck(ctx, s.deckID)
	if err != nil {
		return game.GameState{}, err
	}

	if len(currentRoom.SelectedQuartetIDs) > 0 {
		selectedQuartets := make([]game.Quartet, 0, len(currentRoom.SelectedQuartetIDs))

		for _, quartet := range loadedDeck.Quartets {
			if currentRoom.SelectedQuartetIDs[string(quartet.ID)] {
				selectedQuartets = append(selectedQuartets, quartet)
			}
		}

		loadedDeck = game.Deck{
			ID:       loadedDeck.ID,
			Title:    loadedDeck.Title,
			Quartets: selectedQuartets,
		}
	}

	players := make([]game.Player, 0, len(currentRoom.Players))

	for _, roomPlayer := range currentRoom.Players {
		if !currentRoom.SelectedPlayerIDs[roomPlayer.ID] {
			continue
		}

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
	state.StartedAt = time.Now().UTC()

	if s.gameRepository != nil {
		if err := s.gameRepository.SaveGame(ctx, currentRoom.ID, s.deckID, state); err != nil {
			return game.GameState{}, err
		}
	}

	if err := s.saveGameEvent(ctx, game.GameEvent{
		ID:        generateHistoryID(),
		GameID:    state.ID,
		RoomID:    string(currentRoom.ID),
		Type:      game.GameEventTypeGameStarted,
		Payload:   map[string]any{},
		CreatedAt: time.Now().UTC(),
	}); err != nil {
		return game.GameState{}, err
	}

	s.mu.Lock()
	s.games[currentRoom.ID] = state
	s.rooms[currentRoom.ID] = currentRoom
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

	if err := s.saveGameHistory(ctx, roomID, state, result); err != nil {
		return game.GameResult{}, err
	}

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

	if err := s.saveGameEvent(ctx, game.GameEvent{
		ID:       generateHistoryID(),
		GameID:   state.ID,
		RoomID:   string(roomID),
		Type:     game.GameEventTypeCardRequested,
		ActorID:  game.PlayerID(actorID),
		TargetID: game.PlayerID(targetPlayerID),
		Payload: map[string]any{
			"card_id":    string(cardID),
			"card_title": result.RequestedCard.Title,
			"quartet_id": string(result.RequestedCard.QuartetID),
		},
		CreatedAt: time.Now().UTC(),
	}); err != nil {
		return game.RequestCardResult{}, game.GameState{}, err
	}

	eventType := game.GameEventTypeCardRequestFailed
	if result.Success {
		eventType = game.GameEventTypeCardRequestSucceeded
	}

	if err := s.saveGameEvent(ctx, game.GameEvent{
		ID:       generateHistoryID(),
		GameID:   state.ID,
		RoomID:   string(roomID),
		Type:     eventType,
		ActorID:  game.PlayerID(actorID),
		TargetID: game.PlayerID(targetPlayerID),
		Payload: map[string]any{
			"card_id":        string(cardID),
			"card_title":     result.RequestedCard.Title,
			"quartet_id":     string(result.RequestedCard.QuartetID),
			"next_player_id": string(result.NextPlayerID),
		},
		CreatedAt: time.Now().UTC(),
	}); err != nil {
		return game.RequestCardResult{}, game.GameState{}, err
	}

	for _, quartetID := range result.CompletedQuartets {
		if err := s.saveGameEvent(ctx, game.GameEvent{
			ID:       generateHistoryID(),
			GameID:   state.ID,
			RoomID:   string(roomID),
			Type:     game.GameEventTypeQuartetCompleted,
			ActorID:  game.PlayerID(actorID),
			TargetID: "",
			Payload: map[string]any{
				"quartet_id": string(quartetID),
			},
			CreatedAt: time.Now().UTC(),
		}); err != nil {
			return game.RequestCardResult{}, game.GameState{}, err
		}
	}

	if result.NextPlayerID != "" {
		if err := s.saveGameEvent(ctx, game.GameEvent{
			ID:       generateHistoryID(),
			GameID:   state.ID,
			RoomID:   string(roomID),
			Type:     game.GameEventTypeTurnChanged,
			ActorID:  game.PlayerID(actorID),
			TargetID: game.PlayerID(result.NextPlayerID),
			Payload: map[string]any{
				"next_player_id": string(result.NextPlayerID),
			},
			CreatedAt: time.Now().UTC(),
		}); err != nil {
			return game.RequestCardResult{}, game.GameState{}, err
		}
	}

	if state.Status == game.GameStatusFinished && s.gameRepository != nil {
		gameResult := game.CalculateGameResult(&state)

		winnerIDs := make([]string, 0, len(gameResult.Winners))

		for _, winnerID := range gameResult.Winners {
			winnerIDs = append(winnerIDs, string(winnerID))
		}

		if err := s.saveGameEvent(ctx, game.GameEvent{
			ID:     generateHistoryID(),
			GameID: state.ID,
			RoomID: string(roomID),
			Type:   game.GameEventTypeGameFinished,
			Payload: map[string]any{
				"winner_ids": winnerIDs,
				"scores":     gameResult.Scores,
			},
			CreatedAt: time.Now().UTC(),
		}); err != nil {
			return game.RequestCardResult{}, game.GameState{}, err
		}

		if err := s.saveGameHistory(ctx, roomID, state, gameResult); err != nil {
			return game.RequestCardResult{}, game.GameState{}, err
		}

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

func (s *Service) saveGameHistory(
	ctx context.Context,
	roomID room.RoomID,
	state game.GameState,
	result game.GameResult,
) error {
	if s.userHistoryRepository == nil {
		return nil
	}

	s.mu.Lock()
	currentRoom, ok := s.rooms[roomID]
	s.mu.Unlock()

	if !ok {
		return nil
	}

	winnerIDs := make(map[string]bool)

	for _, winnerID := range result.Winners {
		winnerIDs[string(winnerID)] = true
	}

	scoreByPlayerID := make(map[string]int)

	for playerID, score := range result.Scores {
		scoreByPlayerID[string(playerID)] = score
	}

	winnerScore := 0
	winnerPlayerName := ""

	for _, player := range currentRoom.Players {
		score := scoreByPlayerID[string(player.ID)]

		if winnerIDs[string(player.ID)] && score >= winnerScore {
			winnerScore = score
			winnerPlayerName = player.Name
		}
	}

	playerResults := make([]user.PlayerGameResult, 0, len(currentRoom.Players))

	for _, player := range currentRoom.Players {
		playerResults = append(playerResults, user.PlayerGameResult{
			PlayerID:   string(player.ID),
			PlayerName: player.Name,
			Score:      scoreByPlayerID[string(player.ID)],
			IsWinner:   winnerIDs[string(player.ID)],
		})
	}

	now := time.Now().UTC()
	durationSeconds := 0

	if !state.StartedAt.IsZero() {
		durationSeconds = int(now.Sub(state.StartedAt).Seconds())
	}

	for _, player := range currentRoom.Players {
		if player.UserID == "" {
			continue
		}

		role := "participant"
		if player.ID == currentRoom.OwnerPlayerID {
			role = "owner"
		}

		record := user.GameHistoryRecord{
			ID:               generateHistoryID(),
			GameID:           string(state.ID),
			RoomID:           string(roomID),
			UserID:           user.UserID(player.UserID),
			Role:             role,
			Score:            scoreByPlayerID[string(player.ID)],
			WinnerScore:      winnerScore,
			WinnerPlayerName: winnerPlayerName,
			DurationSeconds:  durationSeconds,
			PlayerResults:    playerResults,
			IsWinner:         winnerIDs[string(player.ID)],
			CreatedAt:        now,
		}

		if err := s.userHistoryRepository.SaveGameHistoryRecord(ctx, record); err != nil {
			return err
		}
	}

	return nil
}

func (s *Service) saveGameEvent(
	ctx context.Context,
	event game.GameEvent,
) error {
	if s.gameEventRepository == nil {
		return nil
	}

	return s.gameEventRepository.SaveGameEvent(ctx, event)
}

func generateHistoryID() string {
	return time.Now().UTC().Format("20060102150405.000000000")
}

func (s *Service) GetGameEvents(
	ctx context.Context,
	gameID game.GameID,
) ([]game.GameEvent, error) {
	if s.gameEventRepository == nil {
		return []game.GameEvent{}, nil
	}

	return s.gameEventRepository.FindGameEventsByGameID(ctx, gameID)
}

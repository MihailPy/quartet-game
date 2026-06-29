package main

import (
	"context"
	"log"
	"net/http"

	"github.com/MihailPy/quartet-game/internal/config"
	"github.com/MihailPy/quartet-game/internal/deck"
	"github.com/MihailPy/quartet-game/internal/game"
	"github.com/MihailPy/quartet-game/internal/gameapp"
	apphttp "github.com/MihailPy/quartet-game/internal/http"
	"github.com/MihailPy/quartet-game/internal/room"
	"github.com/MihailPy/quartet-game/internal/storage/postgres"
)

func main() {
	cfg := config.Load()

	db, err := postgres.Connect(cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("failed to connect to database: %v", err)
	}
	defer db.Close()

	deckRepository := postgres.NewDeckRepository(db)
	quartetRepository := postgres.NewQuartetRepository(db)
	deckService := deck.NewService(deckRepository, quartetRepository)
	defaultDeck, err := deckService.LoadDeck(
		context.Background(),
		game.DeckID(cfg.DefaultDeckID),
	)
	if err != nil {
		log.Fatalf("failed to load default deck: %v", err)
	}

	maxPlayers := game.MaxPlayersForDeck(defaultDeck)

	roomRepository := postgres.NewRoomRepository(db)
	roomManager := room.NewManager(roomRepository, maxPlayers)
	userRepository := postgres.NewUserRepository(db)
	userHistoryRepository := postgres.NewUserHistoryRepository(db)
	gameEventRepository := postgres.NewGameEventRepository(db)
	gameRepository := postgres.NewGameRepository(db)

	gameService := gameapp.NewService(
		deckService,
		gameRepository,
		userHistoryRepository,
		gameEventRepository,
		game.DeckID(cfg.DefaultDeckID),
	)

	router := apphttp.NewRouter(roomManager, gameService, gameService, deckService, userRepository, quartetRepository)

	log.Printf("Quartet Game API is running on %s", cfg.HTTPAddr)

	if err := http.ListenAndServe(cfg.HTTPAddr, router); err != nil {
		log.Fatal(err)
	}
}

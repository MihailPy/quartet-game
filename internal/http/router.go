package http

import (
	"net/http"
	"os"
	"strings"

	"github.com/MihailPy/quartet-game/internal/game"
	"github.com/MihailPy/quartet-game/internal/http/handlers"
	"github.com/MihailPy/quartet-game/internal/room"
	"github.com/MihailPy/quartet-game/internal/user"
	"github.com/MihailPy/quartet-game/internal/ws"
)

func NewRouter(
	roomManager *room.Manager,
	gameStarter handlers.GameStarter,
	gameService ws.GameService,
	deckService handlers.DeckService,
	userRepository handlers.UserRepository,
	quartetRepository handlers.QuartetRepository,
) http.Handler {
	mux := http.NewServeMux()

	wsHub := ws.NewHub()

	roomHandler := handlers.NewRoomHandler(
		roomManager,
		gameStarter,
		wsHub,
		deckService,
		userRepository,
	)

	wsHandler := ws.NewHandler(
		roomManager,
		wsHub,
		gameService,
	)

	userHandler := handlers.NewUserHandler(userRepository)
	quartetHandler := handlers.NewQuartetHandler(quartetRepository)

	mux.HandleFunc("/health", healthHandler)
	mux.HandleFunc("/rooms", roomHandler.CreateRoom)
	mux.HandleFunc("/rooms/", func(w http.ResponseWriter, r *http.Request) {
		path := strings.TrimPrefix(r.URL.Path, "/rooms/")
		parts := strings.Split(path, "/")

		if len(parts) == 1 {
			roomID := room.RoomID(parts[0])
			roomHandler.GetRoom(w, r, roomID)
			return
		}

		if len(parts) != 2 {
			w.WriteHeader(http.StatusNotFound)
			return
		}

		roomID := room.RoomID(parts[0])
		action := parts[1]
		switch action {
		case "join":
			roomHandler.JoinRoom(w, r, roomID)
		case "ready":
			roomHandler.MarkPlayerReady(w, r, roomID)
		case "selected-player":
			roomHandler.ToggleSelectedPlayer(w, r, roomID)
		case "selected-quartet":
			roomHandler.ToggleSelectedQuartet(w, r, roomID)
		case "available-quartets":
			roomHandler.GetAvailableQuartets(w, r, roomID)
		case "start":
			roomHandler.StartRoom(w, r, roomID)
		case "state":
			roomHandler.GetGameState(w, r, roomID)
		case "deck":
			roomHandler.GetRoomDeck(w, r, roomID)
		case "hand":
			roomHandler.GetPlayerHand(w, r, roomID)
		case "ws":
			wsHandler.HandleConnection(w, r, roomID)
		default:
			w.WriteHeader(http.StatusNotFound)
		}
	})

	mux.HandleFunc("/users/login", userHandler.LoginUser)

	mux.HandleFunc("/users", userHandler.CreateUser)
	mux.HandleFunc("/users/", func(w http.ResponseWriter, r *http.Request) {
		path := strings.TrimPrefix(r.URL.Path, "/users/")
		parts := strings.Split(path, "/")

		userID := user.UserID(parts[0])

		if len(parts) == 2 && parts[1] == "history" {
			userHandler.GetUserHistory(w, r, userID)
			return
		}

		if len(parts) == 3 && parts[1] == "quartets" {
			quartetID := game.QuartetID(parts[2])
			quartetHandler.DeleteUserQuartet(w, r, userID, quartetID)
			return
		}

		if r.Method == http.MethodPatch {
			userHandler.UpdatePlayerName(w, r, userID)
			return
		}

		userHandler.GetUser(w, r, userID)
	})

	mux.HandleFunc("/quartets", func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodGet {
			quartetHandler.ListUserQuartets(w, r)
			return
		}

		quartetHandler.CreateUserQuartet(w, r)
	})

	return withCORS(mux)
}

func healthHandler(w http.ResponseWriter, r *http.Request) {
	w.WriteHeader(http.StatusOK)
	_, _ = w.Write([]byte("OK"))
}

func allowedOrigins() []string {
	origins := []string{
		"http://localhost:5173",
		"http://127.0.0.1:5173",
	}

	if value := os.Getenv("ALLOWED_ORIGINS"); value != "" {
		for _, origin := range strings.Split(value, ",") {
			origin = strings.TrimSpace(origin)
			if origin != "" {
				origins = append(origins, origin)
			}
		}
	}

	return origins
}

func isAllowedOrigin(origin string) bool {
	if origin == "" {
		return true
	}

	for _, allowedOrigin := range allowedOrigins() {
		if origin == allowedOrigin {
			return true
		}
	}

	return false
}

func withCORS(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		origin := r.Header.Get("Origin")
		if isAllowedOrigin(origin) {
			w.Header().Set("Access-Control-Allow-Origin", origin)
		}
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}

		next.ServeHTTP(w, r)
	})
}

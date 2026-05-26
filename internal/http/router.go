package http

import (
	"net/http"
	"strings"

	"github.com/MihailPy/quartet-game/internal/http/handlers"
	"github.com/MihailPy/quartet-game/internal/room"
	"github.com/MihailPy/quartet-game/internal/ws"
)

func NewRouter(roomManager *room.Manager, gameStarter handlers.GameStarter, gameService ws.GameService) http.Handler {
	mux := http.NewServeMux()

	roomHandler := handlers.NewRoomHandler(roomManager, gameStarter)

	mux.HandleFunc("/health", healthHandler)
	mux.HandleFunc("/rooms", roomHandler.CreateRoom)

	wsHub := ws.NewHub()
	wsHandler := ws.NewHandler(roomManager, wsHub, gameService)

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
		case "start":
			roomHandler.StartRoom(w, r, roomID)
		case "state":
			roomHandler.GetRoomState(w, r, roomID)
		case "ws":
			wsHandler.HandleConnection(w, r, roomID)
		default:
			w.WriteHeader(http.StatusNotFound)
		}
	})

	return withCORS(mux)
}

func healthHandler(w http.ResponseWriter, r *http.Request) {
	w.WriteHeader(http.StatusOK)
	_, _ = w.Write([]byte("OK"))
}

func withCORS(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "http://localhost:5173")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}

		next.ServeHTTP(w, r)
	})
}

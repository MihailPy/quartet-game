package http

import (
	"net/http"
	"strings"

	"github.com/MihailPy/quartet-game/internal/http/handlers"
	"github.com/MihailPy/quartet-game/internal/room"
	"github.com/MihailPy/quartet-game/internal/ws"
)

func NewRouter(roomManager *room.Manager, gameStarter handlers.GameStarter) http.Handler {
	mux := http.NewServeMux()

	roomHandler := handlers.NewRoomHandler(roomManager, gameStarter)

	mux.HandleFunc("/health", healthHandler)
	mux.HandleFunc("/rooms", roomHandler.CreateRoom)

	wsHub := ws.NewHub()
	wsHandler := ws.NewHandler(roomManager, wsHub)

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

	return mux
}

func healthHandler(w http.ResponseWriter, r *http.Request) {
	w.WriteHeader(http.StatusOK)
	_, _ = w.Write([]byte("OK"))
}

package http

import (
	"net/http"

	"github.com/MihailPy/quartet-game/internal/http/handlers"
	"github.com/MihailPy/quartet-game/internal/room"
)

func NewRouter() http.Handler {
	mux := http.NewServeMux()

	roomManager := room.NewManager()
	roomHandler := handlers.NewRoomHandler(roomManager)

	mux.HandleFunc("/health", healthHandler)
	mux.HandleFunc("/rooms", roomHandler.CreateRoom)

	return mux
}

func healthHandler(w http.ResponseWriter, r *http.Request) {
	w.WriteHeader(http.StatusOK)
	_, _ = w.Write([]byte("OK"))
}

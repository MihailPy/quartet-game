package ws

import (
	"net/http"

	"github.com/gorilla/websocket"
)

type Handler struct{}

func NewHandler() *Handler {
	return &Handler{}
}

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

func (h *Handler) HandleConnection(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		return
	}

	defer conn.Close()

	err = conn.WriteJSON(map[string]string{
		"type":    "connected",
		"message": "connected to room websocket",
	})
	if err != nil {
		return
	}

	for {
		_, _, err := conn.ReadMessage()
		if err != nil {
			return
		}
	}
}

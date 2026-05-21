package main

import (
	"log"
	"net/http"

	"github.com/MihailPy/quartet-game/internal/config"
	apphttp "github.com/MihailPy/quartet-game/internal/http"
)

func main() {
	cfg := config.Load()

	router := apphttp.NewRouter()

	log.Printf("Quartet Game API is running on %s", cfg.HTTPAddr)
	if err := http.ListenAndServe(cfg.HTTPAddr, router); err != nil {
		log.Fatal(err)
	}
}

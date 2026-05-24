package main

import (
	"log"
	"net/http"

	"github.com/MihailPy/quartet-game/internal/config"
	apphttp "github.com/MihailPy/quartet-game/internal/http"
	"github.com/MihailPy/quartet-game/internal/storage/postgres"
)

func main() {
	cfg := config.Load()

	db, err := postgres.Connect(cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("failed to connect to database: %v", err)

	}
	defer db.Close()

	router := apphttp.NewRouter()

	log.Printf("Quartet Game API is running on %s", cfg.HTTPAddr)

	if err := http.ListenAndServe(cfg.HTTPAddr, router); err != nil {
		log.Fatal(err)
	}
}

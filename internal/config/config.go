package config

import "os"

type Config struct {
	HTTPAddr      string
	DatabaseURL   string
	DefaultDeckID string
}

func Load() Config {
	return Config{
		HTTPAddr:      getEnv("HTTP_ADDR", ":8080"),
		DatabaseURL:   getEnv("DATABASE_URL", "postgres://quartet_user:quartet_password@localhost:5432/quartet_game?sslmode=disable"),
		DefaultDeckID: getEnv("DEFAULT_DECK_ID", "00000000-0000-0000-0000-000000000001"),
	}
}

func getEnv(key string, fallback string) string {
	value := os.Getenv(key)
	if value == "" {
		return fallback
	}

	return value
}

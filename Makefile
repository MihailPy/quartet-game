APP_NAME=quartet-game
MAIN_PATH=./cmd/api
DATABASE_URL=postgres://quartet_user:quartet_password@localhost:5432/quartet_game?sslmode=disable
ALLOWED_ORIGINS=http://192.168.1.17:5173,http://localhost:5173

.PHONY: run test fmt tidy build clean migrate-up migrate-down migrate-force

run:
	go run $(MAIN_PATH)

run-wifi:
	ALLOWED_ORIGINS=$(ALLOWED_ORIGINS) go run ./cmd/api

test:
	go test ./...

fmt:
	go fmt ./...

tidy:
	go mod tidy

build:
	mkdir -p bin
	go build -o bin/$(APP_NAME) $(MAIN_PATH)

clean:
	rm -rf bin

migrate-up:
	migrate -path migrations -database "$(DATABASE_URL)" up

migrate-down:
	migrate -path migrations -database "$(DATABASE_URL)" down 1

migrate-force:
	migrate -path migrations -database "$(DATABASE_URL)" force 1

web-dev:
	cd web && npm run dev

web-dev-host:
	cd web && npm run dev -- --host 0.0.0.0

web-test:
	cd web && npm run lint && npm run build

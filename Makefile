APP_NAME=quartet-game
MAIN_PATH=./cmd/api
DATABASE_URL=postgres://quartet_user:quartet_password@localhost:5432/quartet_game?sslmode=disable

.PHONY: run test fmt tidy build clean migrate-up migrate-down migrate-force

run:
	go run $(MAIN_PATH)

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

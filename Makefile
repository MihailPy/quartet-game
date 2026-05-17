APP_NAME=quartet-game
MAIN_PATH=./cmd/api

.PHONY: run test fmt tidy build clean

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

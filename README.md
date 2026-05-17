# Quartet Game

Online implementation of the **Quartet** card game.

## About

Quartet Game is a backend-first project for playing the Quartet card game online.
The first goal is to build a clean game engine and API.  
Later the project will include a web interface and possibly a mobile app.

## Current stack

- Go
- HTTP API
- WebSocket later
- PostgreSQL later
- Docker

## Project structure

```text
cmd/
  api/              Application entry point
internal/
  config/           Application configuration
  game/             Game domain and rules
  room/             Game rooms and room manager
  http/             HTTP handlers
  storage/          Storage layer
migrations/         Database migrations
```

## Run locally

Run application:

```bash
    make run
```

Healthcheck:

```bash
    curl http://localhost:8080/health

```

## Run with Docker

Build image:

```bash
    docker build -t quartet-game-api .

```

Run container:

```bash
    docker run --rm -p 8080:8080 quartet-game-api

```

Healthcheck:

```bash
    curl http://localhost:8080/health

```

## Useful commands

```bash
    make run
    make test
    make fmt
    make tidy
    make build
    make clean

```

## Development status

Done:

- Initial Go project structure
- Basic HTTP server
- Application config
- Makefile
- Dockerfile

Next:

- Game domain models
- Game state
- Deck shuffling
- Card dealing
- Turn logic

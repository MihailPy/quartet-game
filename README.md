# Quartet Game

Online implementation of the **Quartet** card game.

## About

Quartet Game is an online multiplayer implementation of the Quartet card game.
The project includes a Go backend, PostgreSQL persistence, WebSocket
synchronization, and a React frontend for manual play and testing.

## Current stack

- Go
- HTTP API
- WebSocket
- PostgreSQL
- Docker
- React
- TypeScript
- Vite

## Project structure

```text
cmd/
  api/              Application entry point
internal/
  config/           Application configuration
  game/             Game domain and rules
  room/             Game rooms and room manager
  http/             HTTP handlers
  ws/               WebSocket hub and handlers
  deck/             Deck service
  gameapp/          Application service for game lifecycle
  storage/          Storage layer
migrations/         Database migrations
web/                React frontend
  src/
    api.ts          HTTP API client
    session.ts      Browser session/localStorage helpers
    types.ts        Frontend TypeScript types
    websocket.ts    WebSocket helpers
    components/     React UI panels
```

## Frontend architecture

The React frontend is organized around a thin top-level coordinator and focused
feature modules:

- `web/src/App.tsx` coordinates application state and event flow;
- `web/src/types.ts` contains frontend TypeScript types;
- `web/src/api.ts` contains HTTP request helpers;
- `web/src/session.ts` contains `localStorage` session persistence helpers;
- `web/src/websocket.ts` contains WebSocket connection helpers;
- `web/src/components/RoomPanel.tsx` renders room creation and join controls;
- `web/src/components/PlayerPanel.tsx` renders player state and actions;
- `web/src/components/GamePanel.tsx` renders the game state and turn actions;
- `web/src/components/PlayerHandPanel.tsx` renders the current player's hand;
- `web/src/components/GameLogPanel.tsx` renders the game log and debug events.

## Run locally with PostgreSQL

Start PostgreSQL:

```bash
docker compose up -d postgres
```

Apply migrations:

```bash
make migrate-up
```

Run backend:

```bash
make run
```

Healthcheck:

```bash
curl http://localhost:8080/health
```

Run frontend:

```bash
cd web
npm install
npm run dev
```

Frontend runs on `http://localhost:5173` and connects to the backend at
`http://localhost:8080`.

## Environment

Default values:

```text
HTTP_ADDR=:8080
DATABASE_URL=postgres://quartet_user:quartet_password@localhost:5432/quartet_game?sslmode=disable
DEFAULT_DECK_ID=00000000-0000-0000-0000-000000000001
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
make migrate-up
make migrate-down
```

Frontend commands:

```bash
cd web
npm run dev
npm run build
npm run lint
```

## API

HTTP:

- `GET /health`
- `POST /rooms`
- `GET /rooms/{id}`
- `POST /rooms/{id}/join`
- `POST /rooms/{id}/ready`
- `POST /rooms/{id}/start`
- `GET /rooms/{id}/state`
- `GET /rooms/{id}/deck`
- `GET /rooms/{id}/hand?player_id={player_id}`

WebSocket:

- `GET /rooms/{id}/ws?player_id={player_id}`

## MVP status

Current MVP supports:

- room creation;
- joining an existing room;
- ready state;
- starting a game;
- WebSocket synchronization;
- WebSocket reconnect on the frontend;
- safe `POST /rooms/{id}/start` response without full private game state;
- private player hands;
- loading the room deck on the frontend through HTTP;
- restoring room and player after browser refresh;
- restoring public game state and current player hand after browser refresh;
- restoring active games from PostgreSQL after backend restart;
- requesting cards;
- persisting game state after card requests;
- turn updates;
- completed quartet events;
- finished game events;
- minimal React UI for manual testing.

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

Backend requires Go, Docker, PostgreSQL, and the `migrate` CLI. Frontend
requires Node.js and npm.

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

If you need custom backend env values, copy `.env.example` and export it before
starting the backend:

```bash
cp .env.example .env
set -a
source .env
set +a
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
cp .env.example .env.local
npm run dev
```

Frontend runs on `http://localhost:5173` and connects to the backend at
`http://localhost:8080`.

## Environment

Example files:

- `.env.example` contains backend environment variables.
- `web/.env.example` contains frontend Vite environment variables.

Default values:

```text
HTTP_ADDR=:8080
DATABASE_URL=postgres://quartet_user:quartet_password@localhost:5432/quartet_game?sslmode=disable
DEFAULT_DECK_ID=00000000-0000-0000-0000-000000000001
ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
VITE_API_URL=http://localhost:8080
VITE_WS_URL=ws://localhost:8080
```

Backend variables are read from the process environment. Frontend variables must
be placed in `web/.env.local` or another Vite env file and require restarting
Vite after changes.

## Run in one Wi-Fi network

Use this mode when frontend is opened from another device on the same Wi-Fi
network, for example a phone or another laptop.

Find the local IP address of the computer running backend and frontend:

```bash
ipconfig getifaddr en0
```

Assume the IP is `192.168.1.45`.

Start backend with the frontend origin allowed:

```bash
ALLOWED_ORIGINS=http://192.168.1.45:5173 make run
```

Configure frontend URLs in `web/.env.local`:

```text
VITE_API_URL=http://192.168.1.45:8080
VITE_WS_URL=ws://192.168.1.45:8080
```

Start Vite so it accepts connections from the local network:

```bash
cd web
npm run dev -- --host 0.0.0.0
```

Open frontend from another device:

```text
http://192.168.1.45:5173
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

## Troubleshooting

Если frontend открывается, но игра не получает события:

- проверь `VITE_WS_URL`;
- убедись, что WebSocket URL содержит IP компьютера, а не `localhost`;
- перезапусти Vite после изменения `.env.local`;
- проверь, что backend запущен с правильным `ALLOWED_ORIGINS`.

Если запросы к backend блокируются CORS:

- проверь `ALLOWED_ORIGINS`;
- origin должен совпадать с адресом frontend, например `http://192.168.1.45:5173`.

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

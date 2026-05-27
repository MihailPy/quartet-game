import { useEffect, useRef, useState } from 'react'
import './App.css'

type Room = {
  id: string
  status: string
  players: Player[]
}

type Player = {
  id: string
  name: string
  is_ready: boolean
  is_connected: boolean
}

type GameState = {
  ID: string
  Deck: Deck
  Status: string
  CurrentPlayerID: string
  Hands: Record<string, Card[]>
  Completed: Record<string, string[]>
}

type Deck = {
  ID: string
  Title: string
  Quartets: Quartet[]
}

type Quartet = {
  ID: string
  Title: string
  Cards: Card[]
}

type Card = {
  ID: string
  QuartetID: string
  Title: string
}

type StartGameResponse = {
  room: Room
  game: GameState
}

type PublicGameState = {
  game_id: string
  status: string
  current_player_id: string
  players: PublicGamePlayer[]
  completed: Record<string, string[]>
}

type PublicGamePlayer = {
  id: string
  name: string
  card_count: number
}

type PlayerHandPayload = {
  player_id: string
  cards: PrivateCard[]
}

type PrivateCard = {
  id: string
  quartet_id: string
  title: string
}

type GameFinishedPayload = {
  game_id: string
  winners: string[]
  scores: PlayerScore[]
}

type PlayerScore = {
  player_id: string
  score: number
}

const API_URL = 'http://localhost:8080'

function App() {
  const [room, setRoom] = useState<Room | null>(null)
  const [error, setError] = useState<string>('')
  const [player, setPlayer] = useState<Player | null>(null)
  const [playerName, setPlayerName] = useState<string>('Mihail')
  const [roomIdInput, setRoomIdInput] = useState<string>('')
  const [game, setGame] = useState<GameState | null>(null)
  const [socketStatus, setSocketStatus] = useState<string>('disconnected')
  const [events, setEvents] = useState<string[]>([])
  const socketRef = useRef<WebSocket | null>(null)
  const [publicGameState, setPublicGameState] = useState<PublicGameState | null>(
    null,
  )
  const [playerHand, setPlayerHand] = useState<PlayerHandPayload | null>(null)
  const [targetPlayerID, setTargetPlayerID] = useState<string>('')
  const [selectedCardID, setSelectedCardID] = useState<string>('')
  const [lastMoveMessage, setLastMoveMessage] = useState<string>('')
  const [currentTurnPlayerID, setCurrentTurnPlayerID] = useState<string>('')
  const [completedQuartetMessage, setCompletedQuartetMessage] = useState<string>('')
  const [gameFinished, setGameFinished] = useState<GameFinishedPayload | null>(null)
  const [gameLog, setGameLog] = useState<string[]>([])
  const [showDebugEvents, setShowDebugEvents] = useState<boolean>(false)

  async function createRoom() {
    setError('')

    try {
      const response = await fetch(`${API_URL}/rooms`, {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error('Failed to create room')
      }

      const createdRoom = (await response.json()) as Room
      setRoom(createdRoom)
      setPlayer(null)
      setGame(null)
      setPlayerHand(null)
      setPublicGameState(null)
      setCompletedQuartetMessage('')
      setLastMoveMessage('')
      setCurrentTurnPlayerID('')
      setRoomIdInput(createdRoom.id)
      setGameFinished(null)
      setGameLog([])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    }
  }

  async function loadRoom() {
    if (!roomIdInput) {
      setError('Enter room id')
      return
    }

    setError('')

    try {
      const response = await fetch(`${API_URL}/rooms/${roomIdInput}`)

      if (!response.ok) {
        throw new Error('Failed to load room')
      }

      const loadedRoom = (await response.json()) as Room
      setRoom(loadedRoom)
      setPlayer(null)
      setGame(null)
      setPlayerHand(null)
      setPublicGameState(null)
      setCompletedQuartetMessage('')
      setLastMoveMessage('')
      setCurrentTurnPlayerID('')
      setGameFinished(null)
      setGameLog([])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    }
  }

  async function joinRoom() {
    if (!room) {
      setError('Create room first')
      return
    }

    setError('')

    try {
      const response = await fetch(`${API_URL}/rooms/${room.id}/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: playerName,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to join room')
      }

      const data = (await response.json()) as {
        player: Player
        room: Room
      }

      setPlayer(data.player)
      setRoom(data.room)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    }
  }

  async function markReady() {
    if (!room || !player) {
      setError('Join room first')
      return
    }

    setError('')

    try {
      const response = await fetch(`${API_URL}/rooms/${room.id}/ready`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          player_id: player.id,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to mark player ready')
      }

      const updatedRoom = (await response.json()) as Room
      setRoom(updatedRoom)

      const updatedPlayer = updatedRoom.players.find(
        (roomPlayer) => roomPlayer.id === player.id,
      )

      if (updatedPlayer) {
        setPlayer(updatedPlayer)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    }
  }

  async function startGame() {
    if (!room) {
      setError('Create room first')
      return
    }

    setError('')

    try {
      const response = await fetch(`${API_URL}/rooms/${room.id}/start`, {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error('Failed to start game')
      }

      const data = (await response.json()) as StartGameResponse

      setRoom(data.room)
      setGame(data.game)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    }
  }

  function requestCard() {
    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
      setError('WebSocket is not connected')
      return
    }

    if (!targetPlayerID || !selectedCardID) {
      setError('Select target player and card')
      return
    }

    setError('')

    socketRef.current.send(
      JSON.stringify({
        type: 'request_card',
        payload: {
          target_player_id: targetPlayerID,
          card_id: selectedCardID,
        },
      }),
    )
  }

  function getPlayerName(playerID: string): string {
    return (
      publicGameState?.players.find((gamePlayer) => gamePlayer.id === playerID)
        ?.name ??
      room?.players.find((roomPlayer) => roomPlayer.id === playerID)?.name ??
      playerID
    )
  }

  function getQuartetTitle(quartetID: string): string {
    return (
      game?.Deck.Quartets.find((quartet) => quartet.ID === quartetID)?.Title ??
      quartetID
    )
  }

  function getAvailableRequestCards() {
    if (!game || !playerHand) {
      return []
    }

    const handCardIDs = new Set(playerHand.cards.map((card) => card.id))
    const handQuartetIDs = new Set(
      playerHand.cards.map((card) => card.quartet_id),
    )

    return game.Deck.Quartets.flatMap((quartet) =>
      quartet.Cards.filter((card) => {
        return (
          handQuartetIDs.has(card.QuartetID) &&
          !handCardIDs.has(card.ID)
        )
      }).map((card) => ({
        id: card.ID,
        title: card.Title,
        quartet_id: card.QuartetID,
        quartet_title: quartet.Title,
      })),
    )
  }

  function addGameLog(message: string) {
    setGameLog((currentLog) => [message, ...currentLog.slice(0, 9)])
  }

  useEffect(() => {
    if (!room || !player) {
      return
    }

    const socketUrl = `ws://localhost:8080/rooms/${room.id}/ws?player_id=${player.id}`
    const socket = new WebSocket(socketUrl)

    socketRef.current = socket
    setSocketStatus('connecting')

    socket.onopen = () => {
      setSocketStatus('connected')
    }

    socket.onmessage = (event) => {
      setEvents((currentEvents) => [
        event.data,
        ...currentEvents.slice(0, 9),
      ])

      try {
        const message = JSON.parse(event.data)

        if (message.type === 'game_started') {
          setRoom(message.payload.room)
          addGameLog('Игра началась.')
        }

        if (message.type === 'game_state') {
          const payload = message.payload as PublicGameState
          setPublicGameState(payload)
          setCurrentTurnPlayerID(payload.current_player_id)
          addGameLog(`Сейчас ходит ${getPlayerName(payload.current_player_id)}.`)
        }

        if (message.type === 'player_hand') {
          setPlayerHand(message.payload as PlayerHandPayload)
          addGameLog('Твоя рука обновлена.')
        }

        if (message.type === 'card_request_result') {
          const success = message.payload.success as boolean
          const nextPlayerID = message.payload.next_player_id as string

          setSelectedCardID('')
          setCurrentTurnPlayerID(nextPlayerID)

          if (success) {
            setLastMoveMessage('Карта найдена. Игрок продолжает ход.')
            addGameLog('Карта найдена. Игрок продолжает ход.')
          } else {
            setLastMoveMessage('Карты нет. Ход переходит другому игроку.')
            addGameLog(`Карты нет. Следующий ходит ${getPlayerName(nextPlayerID)}.`)
          }
        }

        if (message.type === 'request_card_error') {
          setError(message.payload.message)
        }

        if (message.type === 'quartet_completed') {
          const playerID = message.payload.player_id as string
          const quartets = message.payload.quartets as string[]

          const playerName =
            publicGameState?.players.find((gamePlayer) => gamePlayer.id === playerID)
              ?.name ?? playerID

          setCompletedQuartetMessage(
            `${playerName} собрал квартет: ${quartets.map(getQuartetTitle).join(', ')}`,
          )

          addGameLog(
            `${playerName} собрал квартет: ${quartets.map(getQuartetTitle).join(', ')}`,
          )
        }

        if (message.type === 'game_finished') {
          const payload = message.payload as GameFinishedPayload

          setGameFinished(payload)
          setLastMoveMessage('Игра завершена.')
          addGameLog(
            `Игра завершена. Победители: ${payload.winners.map(getPlayerName).join(', ')}`,
          )
        }
      } catch {
        // ignore invalid websocket message
      }
    }

    socket.onerror = () => {
      setSocketStatus('error')
    }

    socket.onclose = () => {
      setSocketStatus('disconnected')
    }

    return () => {
      socket.close()
      socketRef.current = null
    }
  }, [room?.id, player?.id])

  const availableRequestCards = getAvailableRequestCards()

  return (
    <main className="app">
      <section className="game-page">
        <header className="game-header">
          <h1>Квартет</h1>
          <p>Минимальный клиент для онлайн-игры</p>
        </header>

        {error && <div className="error">{error}</div>}

        <section className="game-layout">
          <div className="panel">
            <h2>Комната</h2>
            <div className="join-form">
              <label>
                ID существующей комнаты
                <input
                  className="input"
                  value={roomIdInput}
                  onChange={(event) => setRoomIdInput(event.target.value)}
                  placeholder="Room ID"
                />
              </label>

              <button className="button" onClick={loadRoom}>
                Открыть комнату
              </button>
            </div>

            <button className="button" onClick={createRoom}>
              Создать комнату
            </button>

            {room && (
              <div className="join-form">
                <label>
                  Имя игрока
                  <input
                    className="input"
                    value={playerName}
                    onChange={(event) => setPlayerName(event.target.value)}
                  />
                </label>

                <button className="button" onClick={joinRoom}>
                  Подключиться
                </button>
              </div>
            )}

            {player && (
              <div className="room-info">
                <p>
                  <strong>Мой игрок:</strong>
                </p>
                <code>{player.id}</code>

                <p>
                  <strong>Имя:</strong> {player.name}
                </p>

                <p>
                  <strong>Статус:</strong> {player.is_ready ? 'готов' : 'не готов'}
                </p>

                <button
                  className="button"
                  onClick={markReady}
                  disabled={player.is_ready || room?.status === 'playing'}
                >
                  {player.is_ready ? 'Готов' : 'Готовиться'}
                </button>
              </div>
            )}

            {room && room.players.length > 0 && (
              <div className="players-list">
                <h3>Игроки</h3>

                {room.players.map((roomPlayer) => (
                  <div className="player-row" key={roomPlayer.id}>
                    <span>{roomPlayer.name}</span>
                    <span>{roomPlayer.is_ready ? 'готов' : 'не готов'}</span>
                  </div>
                ))}
              </div>
            )}
            {room && room.players.length >= 2 && (
              <button
                className="button start-button"
                onClick={startGame}
                disabled={
                  room.status === 'playing' ||
                  !room.players.every((roomPlayer) => roomPlayer.is_ready)
                }
              >
                {room.status === 'playing' ? 'Игра началась' : 'Старт игры'}
              </button>
            )}
          </div>

          <div className="panel">
            <h2>Игра</h2>

            <div className="socket-status">
              <strong>WebSocket:</strong> {socketStatus}
            </div>

            {!game && !publicGameState && <p>Игра ещё не началась.</p>}

            {(game || publicGameState) && (
              <div className="game-info">
                <p>
                  <strong>Статус:</strong>{' '}
                  {publicGameState ? publicGameState.status : game?.Status}
                </p>

                <p>
                  <strong>Сейчас ходит:</strong>
                </p>

                {(() => {
                  const turnPlayerID =
                    currentTurnPlayerID ||
                    publicGameState?.current_player_id ||
                    game?.CurrentPlayerID ||
                    ''

                  if (!turnPlayerID) {
                    return <p>Пока неизвестно.</p>
                  }

                  return (
                    <div>
                      <p className="turn-player-name">
                        {getPlayerName(turnPlayerID)}
                        {player?.id === turnPlayerID ? ' — твой ход' : ''}
                      </p>

                      <small className="technical-id">{turnPlayerID}</small>
                    </div>
                  )
                })()}

                {lastMoveMessage && (
                  <div className="move-message">
                    {lastMoveMessage}
                  </div>
                )}

                {completedQuartetMessage && (
                  <div className="quartet-message">
                    {completedQuartetMessage}
                  </div>
                )}

                {gameFinished && (
                  <div className="game-finished">
                    <h3>Игра завершена</h3>

                    <p>
                      <strong>Победители:</strong>{' '}
                      {gameFinished.winners.map(getPlayerName).join(', ')}
                    </p>

                    <h4>Счёт</h4>

                    {gameFinished.scores.map((score) => (
                      <div className="player-row" key={score.player_id}>
                        <span>{getPlayerName(score.player_id)}</span>
                        <span>{score.player_id}</span>
                        <span>{score.score}</span>
                      </div>
                    ))}
                  </div>
                )}

                {player && publicGameState && (
                  <div className="request-form">
                    <h3>Запрос карты</h3>

                    <label>
                      У кого спросить
                      <select
                        className="input"
                        value={targetPlayerID}
                        onChange={(event) => setTargetPlayerID(event.target.value)}
                      >
                        <option value="">Выбери игрока</option>

                        {publicGameState.players
                          .filter((gamePlayer) => gamePlayer.id !== player.id)
                          .map((gamePlayer) => (
                            <option key={gamePlayer.id} value={gamePlayer.id}>
                              {gamePlayer.name}
                            </option>
                          ))}
                      </select>
                    </label>

                    <label>
                      Какую карту спросить
                      <select
                        className="input"
                        value={selectedCardID}
                        onChange={(event) => setSelectedCardID(event.target.value)}
                      >
                        <option value="">Выбери карту</option>

                        {availableRequestCards.map((card) => (
                          <option key={card.id} value={card.id}>
                            {card.title} — {card.quartet_title}
                          </option>
                        ))}
                      </select>
                      {availableRequestCards.length === 0 && (
                        <p className="form-hint">
                          Нет карт, которые можно спросить по текущим квартетам.
                        </p>
                      )}
                    </label>

                    <button
                      className="button"
                      onClick={requestCard}
                      disabled={Boolean(
                        gameFinished ||
                        availableRequestCards.length === 0 ||
                        (player && currentTurnPlayerID && currentTurnPlayerID !== player.id),
                      )}
                    >
                      {gameFinished
                        ? 'Игра завершена'
                        : availableRequestCards.length === 0
                          ? 'Нет доступных карт для запроса'
                          : player && currentTurnPlayerID && currentTurnPlayerID !== player.id
                            ? 'Сейчас не твой ход'
                            : 'Спросить карту'}
                    </button>
                  </div>
                )}

                <h3>Карты игроков</h3>

                {publicGameState
                  ? publicGameState.players.map((gamePlayer) => (
                    <div
                      className={
                        gamePlayer.id === currentTurnPlayerID
                          ? 'player-row player-row-active'
                          : 'player-row'
                      }
                      key={gamePlayer.id}
                    >
                      <span>
                        {gamePlayer.name}
                        {player?.id === gamePlayer.id ? ' (ты)' : ''}
                      </span>
                      <span>{gamePlayer.card_count} карт</span>
                    </div>
                  ))
                  : Object.entries(game?.Hands ?? {}).map(([playerID, cards]) => (
                    <div className="player-row" key={playerID}>
                      <span>{getPlayerName(playerID)}</span>
                      <span>{cards.length} карт</span>
                    </div>
                  ))}
              </div>
            )}

            <div className="events-list">
              <h3>Журнал игры</h3>

              {gameLog.length === 0 && <p>Пока событий нет.</p>}

              {gameLog.map((event, index) => (
                <div className="log-item" key={`${event}-${index}`}>
                  {event}
                </div>
              ))}
            </div>

            <div className="debug-events">
              <button
                className="secondary-button"
                type="button"
                onClick={() => setShowDebugEvents((current) => !current)}
              >
                {showDebugEvents ? 'Скрыть debug-события' : 'Показать debug-события'}
              </button>

              {showDebugEvents && (
                <div className="debug-events-list">
                  {events.length === 0 && <p>Debug-событий пока нет.</p>}

                  {events.map((event, index) => (
                    <pre className="event-item" key={`${event}-${index}`}>
                      {event}
                    </pre>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="panel">
            <h2>Моя рука</h2>

            {!player && <p>Сначала подключись к комнате.</p>}

            {player && !game && !playerHand && <p>Карты появятся после старта игры.</p>}

            {player && (playerHand || game) && (
              <div className="cards-list">
                {playerHand
                  ? playerHand.cards.map((card) => (
                    <div className="card" key={card.id}>
                      <strong>{card.title}</strong>
                      <span>Квартет: {getQuartetTitle(card.quartet_id)}</span>
                      <small>{card.id}</small>
                    </div>
                  ))
                  : (game?.Hands[player.id] ?? []).map((card) => (
                    <div className="card" key={card.ID}>
                      <strong>{card.Title}</strong>
                      <span>Квартет: {getQuartetTitle(card.QuartetID)}</span>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </section>
      </section>
    </main>
  )
}

export default App

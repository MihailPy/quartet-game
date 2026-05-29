import { useEffect, useRef, useState } from 'react'
import {
  createRoomRequest,
  joinRoomRequest,
  loadDeckRequest,
  loadGameStateRequest,
  loadPlayerHandRequest,
  loadRoomRequest,
  markReadyRequest,
  startGameRequest,
} from './api'
import './App.css'
import { GamePanel } from './components/GamePanel'
import { PlayerPanel } from './components/PlayerPanel'
import { RoomPanel } from './components/RoomPanel'
import {
  clearPlayer,
  clearSession,
  loadPlayer,
  loadRoomID,
  savePlayer,
  saveRoomID,
} from './session'
import type {
  Deck,
  GameFinishedPayload,
  GameStartedPayload,
  Player,
  PlayerHandPayload,
  PublicGameState,
  RequestableCard,
  Room,
} from './types'
import {
  buildRequestCardMessage,
  buildRoomWebSocketURL,
} from './websocket'

function App() {
  const [room, setRoom] = useState<Room | null>(null)
  const [error, setError] = useState<string>('')
  const [player, setPlayer] = useState<Player | null>(null)
  const [playerName, setPlayerName] = useState<string>('Mihail')
  const [roomIdInput, setRoomIdInput] = useState<string>('')
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
  const [deck, setDeck] = useState<Deck | null>(null)
  const [reconnectAttempt, setReconnectAttempt] = useState<number>(0)

  function resetGameState() {
    setDeck(null)
    setPublicGameState(null)
    setPlayerHand(null)
    setTargetPlayerID('')
    setSelectedCardID('')
    setLastMoveMessage('')
    setCompletedQuartetMessage('')
    setCurrentTurnPlayerID('')
    setGameFinished(null)
    setGameLog([])
    setEvents([])
    setError('')
    setReconnectAttempt(0)
  }

  async function createRoom() {
    setError('')

    try {
      const createdRoom = await createRoomRequest()

      setRoom(createdRoom)
      setPlayer(null)
      setRoomIdInput(createdRoom.id)
      resetGameState()

      saveRoomID(createdRoom.id)
      clearPlayer()

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
      const loadedRoom = await loadRoomRequest(roomIdInput)

      setRoom(loadedRoom)
      setPlayer(null)
      resetGameState()

      saveRoomID(loadedRoom.id)
      clearPlayer()

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
      const data = await joinRoomRequest(room.id, playerName)

      setRoom(data.room)
      setPlayer(data.player)
      resetGameState()

      saveRoomID(data.room.id)
      savePlayer(data.player)

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
      const updatedRoom = await markReadyRequest(room.id, player.id)

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
      const data = await startGameRequest(room.id)

      setRoom(data.room)
      setPublicGameState(data.state)
      setCurrentTurnPlayerID(data.state.current_player_id)

      await loadDeck(data.room.id)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    }
  }

  function requestCard() {
    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
      setError('Нет подключения к серверу.')
      return
    }

    if (!targetPlayerID) {
      setError('Выбери игрока, у которого хочешь спросить карту.')
      return
    }

    if (!selectedCardID) {
      setError('Выбери карту, которую хочешь спросить.')
      return
    }

    if (gameFinished) {
      setError('Игра уже завершена.')
      return
    }

    if (player && currentTurnPlayerID && currentTurnPlayerID !== player.id) {
      setError('Сейчас не твой ход.')
      return
    }

    setError('')

    socketRef.current.send(
      JSON.stringify(buildRequestCardMessage(targetPlayerID, selectedCardID)),
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
      deck?.Quartets.find((quartet) => quartet.ID === quartetID)?.Title ??
      quartetID
    )
  }

  function getAvailableRequestCards(): RequestableCard[] {
    if (!deck || !playerHand) {
      return []
    }

    const handCardIDs = new Set(playerHand.cards.map((card) => card.id))
    const handQuartetIDs = new Set(
      playerHand.cards.map((card) => card.quartet_id),
    )

    return deck.Quartets.flatMap((quartet) =>
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

  function getRequestCardErrorMessage(code?: string): string {
    switch (code) {
      case 'not_your_turn':
        return 'Сейчас не твой ход.'
      case 'card_not_found':
        return 'Такая карта не найдена.'
      case 'target_player_not_found':
        return 'Такой игрок не найден.'
      case 'player_does_not_have_quartet_card':
        return 'Можно спрашивать только карту из квартета, который есть у тебя в руке.'
      case 'cannot_request_card':
        return 'Сейчас нельзя запросить карту.'
      default:
        return 'Не удалось выполнить ход.'
    }
  }

  function canRequestCard(): boolean {
    return Boolean(
      player &&
      publicGameState &&
      !gameFinished &&
      socketStatus === 'connected' &&
      currentTurnPlayerID === player.id &&
      targetPlayerID &&
      selectedCardID &&
      availableRequestCards.length > 0,
    )
  }

  function getRequestButtonText(): string {
    if (!player) {
      return 'Сначала подключись'
    }

    if (socketStatus !== 'connected') {
      return 'Нет подключения'
    }

    if (gameFinished) {
      return 'Игра завершена'
    }

    if (!currentTurnPlayerID) {
      return 'Ожидание хода'
    }

    if (currentTurnPlayerID !== player.id) {
      return 'Сейчас не твой ход'
    }

    if (availableRequestCards.length === 0) {
      return 'Нет доступных карт'
    }

    if (!targetPlayerID) {
      return 'Выбери игрока'
    }

    if (!selectedCardID) {
      return 'Выбери карту'
    }

    return 'Спросить карту'
  }

  async function loadDeck(roomID: string) {
    const data = await loadDeckRequest(roomID)

    if (!data) {
      return
    }

    setDeck(data.deck)
  }

  async function loadGameState(roomID: string) {
    const data = await loadGameStateRequest(roomID)

    if (!data) {
      setPublicGameState(null)
      setCurrentTurnPlayerID('')
      addGameLog('Не удалось восстановить состояние игры после reconnect.')
      return
    }

    setPublicGameState(data)
    setCurrentTurnPlayerID(data.current_player_id)
  }

  async function loadPlayerHand(roomID: string, playerID: string) {
    const data = await loadPlayerHandRequest(roomID, playerID)

    if (!data) {
      setPlayerHand(null)
      return
    }

    setPlayerHand(data)
  }

  useEffect(() => {
    if (!room || !player) return

    let shouldReconnect = true

    const socketUrl = buildRoomWebSocketURL(room.id, player.id)
    const socket = new WebSocket(socketUrl)

    socketRef.current = socket
    setSocketStatus('connecting')

    socket.onopen = () => {
      setSocketStatus('connected')

      void loadDeck(room.id)
      void loadGameState(room.id)
      void loadPlayerHand(room.id, player.id)
    }

    socket.onmessage = (event) => {
      setEvents((currentEvents) => [
        event.data,
        ...currentEvents.slice(0, 9),
      ])

      try {
        const message = JSON.parse(event.data)

        if (message.type === 'game_started') {
          const payload = message.payload as GameStartedPayload

          setRoom(payload.room)
          setDeck(payload.deck)
          addGameLog('Игра началась.')

          void loadGameState(payload.room.id)

          if (player) {
            void loadPlayerHand(payload.room.id, player.id)
          }
        }

        if (message.type === 'game_state') {
          const payload = message.payload as PublicGameState
          setPublicGameState(payload)
          setCurrentTurnPlayerID(payload.current_player_id)
          addGameLog(`Сейчас ходит ${getPlayerName(payload.current_player_id)}.`)
        }

        if (message.type === 'turn_changed') {
          const payload = message.payload as {
            current_player_id: string
          }

          setCurrentTurnPlayerID(payload.current_player_id)
          setTargetPlayerID('')
          setSelectedCardID('')
          addGameLog(`Ходит ${getPlayerName(payload.current_player_id)}.`)
        }

        if (message.type === 'player_hand') {
          setPlayerHand(message.payload as PlayerHandPayload)
          addGameLog('Твоя рука обновлена.')
        }

        if (message.type === 'card_request_result') {
          const success = message.payload.success as boolean
          const nextPlayerID = message.payload.next_player_id as string

          setError('')
          setTargetPlayerID('')
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
          const payload = message.payload as {
            code?: string
            message?: string
          }

          const errorMessage = getRequestCardErrorMessage(payload.code)

          setError(errorMessage)
          addGameLog(errorMessage)
        }

        if (message.type === 'quartet_completed') {
          const playerID = message.payload.player_id as string
          const quartets = message.payload.quartets as string[]

          const playerName = getPlayerName(playerID)
          const quartetTitles = quartets.map(getQuartetTitle).join(', ')

          const messageText = `${playerName} собрал квартет: ${quartetTitles}`

          setCompletedQuartetMessage(messageText)
          addGameLog(messageText)
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
      if (!shouldReconnect) {
        return
      }

      window.setTimeout(() => {
        setReconnectAttempt((currentAttempt) => currentAttempt + 1)
      }, 2000)
    }

    return () => {
      shouldReconnect = false
      socket.close()
      socketRef.current = null
    }
  }, [room?.id, player?.id, reconnectAttempt])

  useEffect(() => {
    async function restoreSession() {
      const savedRoomID = loadRoomID()
      const savedPlayer = loadPlayer()

      if (!savedRoomID) {
        return
      }

      try {
        let loadedRoom: Room

        try {
          loadedRoom = await loadRoomRequest(savedRoomID)
        } catch {
          clearSession()

          return
        }

        setRoom(loadedRoom)
        setRoomIdInput(loadedRoom.id)

        if (loadedRoom.status === 'playing') {
          void loadDeck(loadedRoom.id)
          void loadGameState(loadedRoom.id)
        }

        if (savedPlayer) {
          const playerStillInRoom = loadedRoom.players.some(
            (roomPlayer) => roomPlayer.id === savedPlayer.id,
          )

          if (playerStillInRoom) {
            setPlayer(savedPlayer)

            if (loadedRoom.status === 'playing') {
              void loadPlayerHand(loadedRoom.id, savedPlayer.id)
            }

            return
          }
        }

        clearSession()

      } catch {
        clearSession()
      }
    }

    void restoreSession()
  }, [])

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
          <RoomPanel
            room={room}
            roomIdInput={roomIdInput}
            onRoomIdInputChange={setRoomIdInput}
            onCreateRoom={createRoom}
            onLoadRoom={loadRoom}
          />

          <PlayerPanel
            room={room}
            player={player}
            playerName={playerName}
            onPlayerNameChange={setPlayerName}
            onJoinRoom={joinRoom}
            onMarkReady={markReady}
          />

          <GamePanel
            room={room}
            player={player}
            publicGameState={publicGameState}
            currentTurnPlayerID={currentTurnPlayerID}
            lastMoveMessage={lastMoveMessage}
            completedQuartetMessage={completedQuartetMessage}
            gameFinished={gameFinished}
            socketStatus={socketStatus}
            targetPlayerID={targetPlayerID}
            selectedCardID={selectedCardID}
            availableRequestCards={availableRequestCards}
            onTargetPlayerIDChange={setTargetPlayerID}
            onSelectedCardIDChange={setSelectedCardID}
            onRequestCard={requestCard}
            onStartGame={startGame}
            getPlayerName={getPlayerName}
            canRequestCard={canRequestCard}
            getRequestButtonText={getRequestButtonText}
          />
          <div className="panel">
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

            {player && !playerHand && <p>Карты появятся после старта игры.</p>}

            {player && playerHand && (
              <div className="cards-list">
                {playerHand.cards.map((card) => (
                  <div className="card" key={card.id}>
                    <strong>{card.title}</strong>
                    <span>Квартет: {getQuartetTitle(card.quartet_id)}</span>
                    <small>{card.id}</small>
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

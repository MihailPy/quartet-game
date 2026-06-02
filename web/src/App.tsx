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
import { GameLogPanel } from './components/GameLogPanel'
import { GamePanel } from './components/GamePanel'
import { PlayerHandPanel } from './components/PlayerHandPanel'
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
  TemporaryMessage,
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
  const [currentTurnPlayerID, setCurrentTurnPlayerID] = useState<string>('')
  const [gameFinished, setGameFinished] = useState<GameFinishedPayload | null>(null)
  const [gameLog, setGameLog] = useState<string[]>([])
  const [temporaryMessages, setTemporaryMessages] = useState<TemporaryMessage[]>([])
  const [showDebugEvents, setShowDebugEvents] = useState<boolean>(false)
  const [deck, setDeck] = useState<Deck | null>(null)
  const deckRef = useRef<Deck | null>(null)
  const [reconnectAttempt, setReconnectAttempt] = useState<number>(0)

  function resetGameState() {
    updateDeck(null)
    setPublicGameState(null)
    setPlayerHand(null)
    setTargetPlayerID('')
    setSelectedCardID('')
    setCurrentTurnPlayerID('')
    setGameFinished(null)
    setGameLog([])
    setTemporaryMessages([])
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

    if (!player) {
      setError('Сначала подключись к комнате.')
      return
    }

    if (!isRoomOwner()) {
      setError('Стартовать игру может только владелец комнаты.')
      return
    }

    if (!canStartGame()) {
      setError('Для старта нужно минимум два игрока, и все должны быть готовы.')
      return
    }

    setError('')

    try {
      const data = await startGameRequest(room.id, player.id)

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
    const currentDeck = deckRef.current as unknown as {
      Quartets?: { ID?: string; Title?: string; id?: string; title?: string }[]
      quartets?: { ID?: string; Title?: string; id?: string; title?: string }[]
    } | null

    const quartets = currentDeck?.Quartets ?? currentDeck?.quartets ?? []

    const quartet = quartets.find(
      (currentQuartet) =>
        currentQuartet.ID === quartetID || currentQuartet.id === quartetID,
    )

    return quartet?.Title ?? quartet?.title ?? quartetID
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

  function showTemporaryMessage(text: string) {
    const id = crypto.randomUUID()

    setTemporaryMessages((currentMessages) => [
      ...currentMessages,
      {
        id,
        text,
      },
    ])

    window.setTimeout(() => {
      setTemporaryMessages((currentMessages) =>
        currentMessages.filter((message) => message.id !== id),
      )
    }, 4000)
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

    updateDeck(data.deck)
  }

  function updateDeck(nextDeck: Deck | null) {
    deckRef.current = nextDeck
    setDeck(nextDeck)
  }

  async function loadGameState(roomID: string) {
    const data = await loadGameStateRequest(roomID)

    if (!data) {
      setPublicGameState(null)
      setCurrentTurnPlayerID('')
      showTemporaryMessage('Не удалось восстановить состояние игры после reconnect.')
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

  function isRoomOwner(): boolean {
    return Boolean(room && player && room.owner_player_id === player.id)
  }

  function canStartGame(): boolean {
    if (!room || !player) {
      return false
    }

    if (!isRoomOwner()) {
      return false
    }

    if (room.players.length < 2) {
      return false
    }

    return room.players.every((roomPlayer) => roomPlayer.is_ready)
  }

  function getAvailableRequestCardsByQuartet() {
    return availableRequestCards.reduce<Record<string, RequestableCard[]>>(
      (groups, card) => {
        const key = card.quartet_id

        if (!groups[key]) {
          groups[key] = []
        }

        groups[key].push(card)

        return groups
      },
      {},
    )
  }

  function getCompletedQuartets() {
    if (!publicGameState) {
      return []
    }

    return Object.entries(publicGameState.completed).flatMap(
      ([playerID, quartetIDs]) =>
        quartetIDs.map((quartetID) => ({
          playerID,
          playerName: getPlayerName(playerID),
          quartetID,
          quartetTitle: getQuartetTitle(quartetID),
        })),
    )
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
          updateDeck(payload.deck)
          showTemporaryMessage('Игра началась.')
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
          showTemporaryMessage(`Ходит ${getPlayerName(payload.current_player_id)}.`)
          addGameLog(`Ходит ${getPlayerName(payload.current_player_id)}.`)
        }

        if (message.type === 'player_hand') {
          setPlayerHand(message.payload as PlayerHandPayload)
          addGameLog('Твоя рука обновлена.')
        }

        if (message.type === 'card_request_result') {
          const payload = message.payload as {
            success: boolean
            next_player_id: string
            requested_card?: {
              title?: string
              Title?: string
            }
            requested_card_title?: string
            card_title?: string
          }

          const cardTitle =
            payload.requested_card?.title ??
            payload.requested_card?.Title ??
            payload.requested_card_title ??
            payload.card_title ??
            'запрошенную карту'

          const nextPlayerName = getPlayerName(payload.next_player_id)

          setError('')
          setTargetPlayerID('')
          setSelectedCardID('')
          setCurrentTurnPlayerID(payload.next_player_id)

          if (payload.success) {
            const resultMessage = `Карта “${cardTitle}” найдена. Игрок продолжает ход.`

            showTemporaryMessage(resultMessage)
            addGameLog(resultMessage)
          } else {
            const resultMessage = `Карты “${cardTitle}” нет. Следующий ходит ${nextPlayerName}.`

            showTemporaryMessage(resultMessage)
            addGameLog(resultMessage)
          }
        }

        if (message.type === 'request_card_error') {
          const payload = message.payload as {
            code?: string
            message?: string
          }

          const errorMessage = getRequestCardErrorMessage(payload.code)

          setError(errorMessage)
          showTemporaryMessage(errorMessage)
          addGameLog(errorMessage)
        }

        if (message.type === 'quartet_completed') {
          const payload = message.payload as {
            player_id: string
            quartets: string[]
          }

          const quartetTitles = payload.quartets
            .map((quartetID) => getQuartetTitle(quartetID))
            .join(', ')

          const messageText = `${getPlayerName(payload.player_id)} собрал квартет “${quartetTitles}”.`

          showTemporaryMessage(messageText)
          addGameLog(messageText)
        }

        if (message.type === 'game_finished') {
          const payload = message.payload as GameFinishedPayload

          setGameFinished(payload)

          const finishedMessage = `Игра завершена. Победители: ${payload.winners
            .map(getPlayerName)
            .join(', ')}`

          showTemporaryMessage(finishedMessage)
          addGameLog(finishedMessage)
        }

        if (message.type === 'room_updated') {
          const payload = message.payload as Room

          setRoom(payload)
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
            currentPlayerID={player?.id ?? null}
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
            temporaryMessages={temporaryMessages}
            gameFinished={gameFinished}
            socketStatus={socketStatus}
            targetPlayerID={targetPlayerID}
            selectedCardID={selectedCardID}
            availableRequestCards={availableRequestCards}
            availableRequestCardsByQuartet={getAvailableRequestCardsByQuartet()}
            onTargetPlayerIDChange={setTargetPlayerID}
            onSelectedCardIDChange={setSelectedCardID}
            onRequestCard={requestCard}
            onStartGame={startGame}
            isRoomOwner={isRoomOwner()}
            canStartGame={canStartGame()}
            getPlayerName={getPlayerName}
            canRequestCard={canRequestCard}
            getRequestButtonText={getRequestButtonText}
            completedQuartets={getCompletedQuartets()}
          />

          <PlayerHandPanel
            player={player}
            playerHand={playerHand}
            getQuartetTitle={getQuartetTitle}
          />

          <GameLogPanel
            gameLog={gameLog}
            events={events}
            showDebugEvents={showDebugEvents}
            onToggleDebugEvents={() => setShowDebugEvents((current) => !current)}
          />
        </section>
      </section>
    </main>
  )
}

export default App

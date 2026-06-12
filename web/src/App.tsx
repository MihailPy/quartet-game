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
import { EntryPanel } from './components/EntryPanel'
import {
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
  RequestCardErrorPayload,
} from './types'
import {
  buildRequestCardMessage,
  buildRoomWebSocketURL,
} from './websocket'

function App() {
  const [room, setRoom] = useState<Room | null>(null)
  const roomRef = useRef<Room | null>(null)
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
  const isDevMode = import.meta.env.DEV
  const [isSessionRestored, setIsSessionRestored] = useState<boolean>(false)

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

  function leaveRoom() {
    if (socketRef.current) {
      socketRef.current.close()
      socketRef.current = null
    }

    updateRoom(null)
    setPlayer(null)
    setRoomIdInput('')
    clearSession()
    resetGameState()
  }

  async function createRoom() {
    setError('')

    try {
      const data = await createRoomRequest(playerName)

      updateRoom(data.room)
      setPlayer(data.player)
      setRoomIdInput(data.room.id)
      resetGameState()

      saveRoomID(data.room.id)
      savePlayer(data.player)

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось создать комнату.')
    }
  }

  async function joinRoomByID() {
    if (!roomIdInput.trim()) {
      setError('Введите ID комнаты.')
      return
    }

    if (!playerName.trim()) {
      setError('Введите имя игрока.')
      return
    }

    setError('')

    try {
      const loadedRoom = await loadRoomRequest(roomIdInput.trim())
      const data = await joinRoomRequest(loadedRoom.id, playerName)

      updateRoom(data.room)
      setPlayer(data.player)
      resetGameState()

      saveRoomID(data.room.id)
      savePlayer(data.player)
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Не удалось войти в комнату.'

      setError(getJoinRoomErrorMessage(message))
    }
  }

  async function markReady() {
    if (!room || !player) {
      setError('Join room first')
      return
    }

    if (!isCurrentPlayerConnected()) {
      setError('Ты не подключён к комнате.')
      return
    }

    setError('')

    try {
      const updatedRoom = await markReadyRequest(room.id, player.id)

      updateRoom(updatedRoom)

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

    if (!isCurrentPlayerConnected()) {
      setError('Ты не подключён к комнате.')
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

      updateRoom(data.room)
      setPublicGameState(data.state)
      setCurrentTurnPlayerID(data.state.current_player_id)

      await loadDeck(data.room.id)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось начать игру.')
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
    const currentRoom = roomRef.current

    return (
      currentRoom?.players.find((roomPlayer) => roomPlayer.id === playerID)?.name ??
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

  function createTemporaryMessageID(): string {
    if (crypto.randomUUID) {
      return crypto.randomUUID()
    }

    return `${Date.now()}-${Math.random().toString(16).slice(2)}`
  }

  function showTemporaryMessage(text: string) {
    const id = createTemporaryMessageID()

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

  function getRequestCardErrorMessage(payload: RequestCardErrorPayload): string {
    if (payload.code === 'not_player_turn') {
      return 'Сейчас не твой ход.'
    }

    if (payload.code === 'card_not_found') {
      return 'Такая карта не найдена.'
    }

    if (payload.code === 'player_has_no_card_from_quartet') {
      return 'Можно спрашивать только карты из квартета, который есть у тебя в руке.'
    }

    if (payload.code === 'target_player_has_no_cards') {
      return 'У выбранного игрока больше нет карт.'
    }

    if (payload.code === 'invalid_request_card_command') {
      return 'Запрос карты заполнен некорректно.'
    }

    if (payload.code === 'cannot_request_card') {
      return 'Сейчас нельзя запросить карту.'
    }

    if (payload.code === 'cannot_transfer_card') {
      return 'Не удалось передать карту.'
    }

    return payload.message || 'Не удалось запросить карту.'
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

  function updateRoom(nextRoom: Room | null) {
    roomRef.current = nextRoom
    setRoom(nextRoom)
  }

  function buildGameFinishedFromState(state: PublicGameState): GameFinishedPayload {
    const scores = state.players.map((statePlayer) => ({
      player_id: statePlayer.id,
      score: state.completed[statePlayer.id]?.length ?? 0,
    }))

    const maxScore = Math.max(...scores.map((score) => score.score))

    const winners = scores
      .filter((score) => score.score === maxScore)
      .map((score) => score.player_id)

    return {
      game_id: state.game_id,
      winners,
      scores,
    }
  }

  async function loadGameState(roomID: string) {
    const data = await loadGameStateRequest(roomID)

    if (!data) {
      setPublicGameState(null)
      setCurrentTurnPlayerID('')
      setGameFinished(null)
      showTemporaryMessage('Не удалось восстановить состояние игры после reconnect.')
      addGameLog('Не удалось восстановить состояние игры после reconnect.')
      return
    }

    setPublicGameState(data)
    setCurrentTurnPlayerID(data.current_player_id)

    if (data.status === 'finished') {
      setGameFinished(buildGameFinishedFromState(data))
    } else {
      setGameFinished(null)
    }
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

  function getCurrentRoomPlayer(): Player | null {
    if (!room || !player) {
      return null
    }

    return room.players.find((roomPlayer) => roomPlayer.id === player.id) ?? null
  }

  function isCurrentPlayerInRoom(): boolean {
    return getCurrentRoomPlayer() !== null
  }

  function isCurrentPlayerConnected(): boolean {
    const currentRoomPlayer = getCurrentRoomPlayer()

    return currentRoomPlayer?.is_connected === true
  }

  function canStartGame(): boolean {
    if (!room || !player) {
      return false
    }

    if (!isCurrentPlayerConnected()) {
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

  function getJoinRoomErrorMessage(message: string): string {
    const normalizedMessage = message.trim().toLowerCase()

    if (normalizedMessage === 'room is full') {
      return 'Комната заполнена.'
    }

    if (normalizedMessage === 'room already started') {
      return 'Игра в этой комнате уже началась.'
    }

    if (normalizedMessage === 'room not found') {
      return 'Комната не найдена.'
    }

    if (normalizedMessage === 'player name is required') {
      return 'Введите имя игрока.'
    }

    return message
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
      setError('')
      addGameLog('WebSocket подключён.')

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

          updateRoom(payload.room)
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

          const playerName = getPlayerName(payload.current_player_id)
          const messageText =
            player?.id === payload.current_player_id
              ? 'Сейчас твой ход.'
              : `Сейчас ходит ${playerName}.`

          showTemporaryMessage(messageText)
          addGameLog(messageText)
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

          setError('')
          setTargetPlayerID('')
          setSelectedCardID('')
          setCurrentTurnPlayerID(payload.next_player_id)

          if (payload.success) {
            const resultMessage = `Карта “${cardTitle}” найдена. Игрок продолжает ход.`

            showTemporaryMessage(resultMessage)
            addGameLog(resultMessage)
          } else {
            const resultMessage = `Карты “${cardTitle}” нет.`

            showTemporaryMessage(resultMessage)
            addGameLog(resultMessage)
          }
        }

        if (message.type === 'request_card_error') {
          const payload = message.payload as RequestCardErrorPayload
          const errorMessage = getRequestCardErrorMessage(payload)

          setError(errorMessage)
          showTemporaryMessage(errorMessage)
          addGameLog(`Ошибка запроса карты: ${errorMessage}`)
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

          const winnerNames = payload.winners.map(getPlayerName).join(', ')
          const winnerLabel = payload.winners.length > 1 ? 'Победители' : 'Победитель'
          const finishedMessage = `Игра завершена. ${winnerLabel}: ${winnerNames}`

          showTemporaryMessage(finishedMessage)
          addGameLog(finishedMessage)
        }

        if (message.type === 'room_updated' || message.type === 'room_state') {
          const payload = message.payload as Room

          updateRoom(payload)
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Не удалось обработать websocket-сообщение.'

        console.error('Failed to handle websocket message:', err, event.data)
        setError(errorMessage)
        addGameLog(`Ошибка websocket-сообщения: ${errorMessage}`)
      }

    }

    socket.onerror = () => {
      setSocketStatus('error')
      setError('Ошибка websocket-подключения.')
      addGameLog('Ошибка websocket-подключения.')
    }

    socket.onclose = () => {
      setSocketStatus('disconnected')
      addGameLog('WebSocket отключён.')

      if (!shouldReconnect) {
        return
      }

      setSocketStatus('reconnecting')

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
        setIsSessionRestored(true)
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

        updateRoom(loadedRoom)
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
      } finally {
        setIsSessionRestored(true)
      }
    }

    void restoreSession()
  }, [])

  useEffect(() => {
    if (!targetPlayerID) {
      return
    }

    const targetPlayer = publicGameState?.players.find(
      (gamePlayer) => gamePlayer.id === targetPlayerID,
    )

    if (!targetPlayer || targetPlayer.card_count === 0) {
      setTargetPlayerID('')
    }
  }, [publicGameState, targetPlayerID])

  const availableRequestCards = getAvailableRequestCards()

  useEffect(() => {
    if (!selectedCardID) {
      return
    }

    const selectedCardIsAvailable = availableRequestCards.some(
      (card) => card.id === selectedCardID,
    )

    if (!selectedCardIsAvailable) {
      setSelectedCardID('')
    }
  }, [availableRequestCards, selectedCardID])

  const isEntered = room !== null && player !== null && isCurrentPlayerInRoom()

  return (
    <main className="app">
      <section className="game-page">
        <header className="game-header">
          <h1>Квартет</h1>
          <p>Минимальный клиент для онлайн-игры</p>
        </header>

        {error && <div className="error">{error}</div>}

        {!isSessionRestored && (
          <div className="panel">
            <p>Восстанавливаем session...</p>
          </div>
        )}

        <section className={isEntered ? 'game-layout' : 'game-layout entry-layout'}>
          {isSessionRestored && !isEntered && (
            <EntryPanel
              playerName={playerName}
              roomIdInput={roomIdInput}
              onPlayerNameChange={setPlayerName}
              onRoomIdInputChange={setRoomIdInput}
              onCreateRoom={createRoom}
              onJoinRoomByID={joinRoomByID}
            />
          )}

          {isSessionRestored && isEntered && (
            <>
              <RoomPanel
                room={room}
                currentPlayerID={player?.id ?? null}
                onLeaveRoom={leaveRoom}
              />

              <PlayerPanel
                player={player}
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
                isDevMode={isDevMode}
                diagnostics={{
                  room,
                  player,
                  socketStatus,
                  publicGameState,
                  playerHand,
                  currentTurnPlayerID,
                  gameFinished,
                }}
              />
            </>
          )}
        </section>
      </section>
    </main>
  )
}

export default App

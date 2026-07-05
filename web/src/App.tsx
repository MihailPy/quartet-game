import { useEffect, useRef, useState } from 'react'
import {
  createRoomRequest,
  createUserQuartetRequest,
  createUserRequest,
  deleteUserQuartetRequest,
  joinRoomRequest,
  loadAvailableQuartetsRequest,
  loadDeckRequest,
  loadGameEventsRequest,
  loadGameStateRequest,
  loadPlayerHandRequest,
  loadRoomRequest,
  loadUserHistoryRequest,
  loadUserQuartetsRequest,
  loadUserRequest,
  loginUserRequest,
  startGameRequest,
  toggleSelectedPlayerRequest,
  toggleSelectedQuartetRequest,
  updatePlayerNameRequest,
  updateUserQuartetRequest,
} from './api'
import './App.css'
import { RequestCardFlow } from './components/RequestCardFlow'
import { PlayerDetailsModal } from './components/PlayerDetailsModal'
import { AccountPanel } from './components/AccountPanel'
import { EntryPanel } from './components/EntryPanel'
import { GamePanel } from './components/GamePanel'
import { GameplayTable } from './components/GameplayTable'
import { HistoryPanel } from './components/HistoryPanel'
import { PlayerHandPanel } from './components/PlayerHandPanel'
import { PlayerPanel } from './components/PlayerPanel'
import { QuartetsPanel } from './components/QuartetsPanel'
import { RoomPanel } from './components/RoomPanel'
import { ToastContainer } from './components/ToastContainer'
import {
  clearSession,
  loadPlayer,
  loadRoomID,
  savePlayer,
  saveRoomID,
} from './session'
import type {
  Deck,
  GameEvent,
  GameFinishedPayload,
  GameHistoryRecord,
  GameStartedPayload,
  Player,
  PlayerHandPayload,
  PrivateCard,
  PublicGameState,
  Quartet,
  RequestableCard,
  RequestCardErrorPayload,
  Room,
  TemporaryMessage,
  ToastMessage,
  ToastType,
  User,
} from './types'
import {
  buildRequestCardMessage,
  buildRoomWebSocketURL,
} from './websocket'

type AppView = 'home' | 'account' | 'quartets' | 'history'

function App() {
  const [room, setRoom] = useState<Room | null>(null)
  const roomRef = useRef<Room | null>(null)
  const [error, setError] = useState<string>('')
  const [player, setPlayer] = useState<Player | null>(null)
  const [playerName, setPlayerName] = useState<string>('Mihail')
  const [roomIdInput, setRoomIdInput] = useState<string>('')
  const [socketStatus, setSocketStatus] = useState<string>('disconnected')
  const socketRef = useRef<WebSocket | null>(null)
  const [publicGameState, setPublicGameState] = useState<PublicGameState | null>(
    null,
  )
  const [playerHand, setPlayerHand] = useState<PlayerHandPayload | null>(null)
  const [targetPlayerID, setTargetPlayerID] = useState<string>('')
  const [selectedCardID, setSelectedCardID] = useState<string>('')
  const [currentTurnPlayerID, setCurrentTurnPlayerID] = useState<string>('')
  const [gameFinished, setGameFinished] = useState<GameFinishedPayload | null>(null)
  const [temporaryMessages, setTemporaryMessages] = useState<TemporaryMessage[]>([])
  const [toasts, setToasts] = useState<ToastMessage[]>([])
  const [deck, setDeck] = useState<Deck | null>(null)
  const deckRef = useRef<Deck | null>(null)
  const [reconnectAttempt, setReconnectAttempt] = useState<number>(0)
  const [isSessionRestored, setIsSessionRestored] = useState<boolean>(false)
  const [isCreatingRoom, setIsCreatingRoom] = useState<boolean>(false)
  const [isJoiningRoom, setIsJoiningRoom] = useState<boolean>(false)
  const [isStartingGame, setIsStartingGame] = useState<boolean>(false)
  const [availableQuartets, setAvailableQuartets] = useState<Quartet[]>([])
  const [user, setUser] = useState<User | null>(null)
  const [userHistory, setUserHistory] = useState<GameHistoryRecord[]>([])
  const [recoveryCode, setRecoveryCode] = useState('')
  const [userQuartets, setUserQuartets] = useState<Quartet[]>([])
  const [quartetTitle, setQuartetTitle] = useState('')
  const [quartetCards, setQuartetCards] = useState(['', '', '', ''])
  const [currentView, setCurrentView] = useState<AppView>('home')
  const [accountPlayerName, setAccountPlayerName] = useState('')
  const [nextPlayerName, setNextPlayerName] = useState('')
  const [editingQuartetID, setEditingQuartetID] = useState<string | null>(null)
  const [isPlayerPanelOpen, setIsPlayerPanelOpen] = useState(false)
  const hasGameStarted = publicGameState !== null
  const [isGameLogOpen, setIsGameLogOpen] = useState(false)
  const [gameEvents, setGameEvents] = useState<GameEvent[]>([])
  const [previewCard, setPreviewCard] = useState<PrivateCard | null>(null)
  const [selectedTablePlayerID, setSelectedTablePlayerID] = useState('')
  const selectedTablePlayer = publicGameState?.players.find((p) => p.id === selectedTablePlayerID) ?? null
  const [isHandOpen, setIsHandOpen] = useState(true)
  const [isRequestFlowOpen, setIsRequestFlowOpen] = useState(false)
  const canOpenRequestFlow =
    player !== null &&
    publicGameState !== null &&
    gameFinished === null &&
    currentTurnPlayerID === player.id

  function resetGameState() {
    updateDeck(null)
    setPublicGameState(null)
    setPlayerHand(null)
    setTargetPlayerID('')
    setSelectedCardID('')
    setCurrentTurnPlayerID('')
    setGameFinished(null)
    setTemporaryMessages([])
    setError('')
    setReconnectAttempt(0)
    setToasts([])
    setAvailableQuartets([])
    setGameEvents([])
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

  async function copyRoomID() {
    if (!room) {
      return
    }

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(room.id)
      } else {
        const textarea = document.createElement('textarea')
        textarea.value = room.id
        textarea.setAttribute('readonly', '')
        textarea.style.position = 'fixed'
        textarea.style.left = '-9999px'

        document.body.appendChild(textarea)
        textarea.select()
        document.execCommand('copy')
        document.body.removeChild(textarea)
      }

      showToast('ID комнаты скопирован.', 'success')
    } catch {
      setError('Не удалось скопировать ID комнаты. Скопируй ID вручную.')
    }
  }

  async function createRoom() {
    if (!user) {
      setError('Чтобы создать комнату, сначала создай аккаунт.')
      return
    }

    setIsCreatingRoom(true)
    setError('')

    try {
      const data = await createRoomRequest(user.id)

      updateRoom(data.room)
      setPlayer(data.player)
      setRoomIdInput(data.room.id)
      resetGameState()

      saveRoomID(data.room.id)
      savePlayer(data.player)
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Не удалось создать комнату.'

      setError(getCreateRoomErrorMessage(message))
    } finally {
      setIsCreatingRoom(false)
    }
  }

  async function createUser() {
    const trimmedName = accountPlayerName.trim()

    if (!trimmedName) {
      setError('Введите имя игрока.')
      return
    }

    try {
      setError('')

      const data = await createUserRequest(trimmedName)

      saveUser(data.user)
      showToast('Аккаунт создан.', 'success')
      setPlayerName(data.user.player_name)
      setAccountPlayerName('')
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Не удалось создать аккаунт.'

      setError(message)
    }
  }

  async function joinRoomByID() {
    if (isJoiningRoom) {
      return
    }

    if (!roomIdInput.trim()) {
      setError('Введите ID комнаты.')
      return
    }

    if (!playerName.trim()) {
      setError('Введите имя игрока.')
      return
    }

    setIsJoiningRoom(true)
    setError('')

    try {
      const loadedRoom = await loadRoomRequest(roomIdInput.trim())
      const data = await joinRoomRequest(
        loadedRoom.id,
        playerName,
        user?.id,
      )

      updateRoom(data.room)
      setPlayer(data.player)
      resetGameState()

      saveRoomID(data.room.id)
      savePlayer(data.player)
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Не удалось войти в комнату.'

      setError(getJoinRoomErrorMessage(message))
    } finally {
      setIsJoiningRoom(false)
    }
  }

  async function startGame() {
    if (isStartingGame) {
      return
    }

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
      setError('Для старта нужно выбрать минимум двух игроков.')
      return
    }

    setIsStartingGame(true)
    setError('')

    try {
      const data = await startGameRequest(room.id, player.id)

      updateRoom(data.room)
      setPublicGameState(data.state)
      setCurrentTurnPlayerID(data.state.current_player_id)

      await loadDeck(data.room.id)
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Не удалось начать игру.'

      if (message.trim().toLowerCase() === 'room already started' && room) {
        await loadDeck(room.id)
        await loadGameState(room.id)

        if (player) {
          await loadPlayerHand(room.id, player.id)
        }

        setError('')
        return
      }

      setError(getStartGameErrorMessage(message))
    } finally {
      setIsStartingGame(false)
    }
  }

  async function toggleSelectedPlayer(targetPlayerID: string) {
    if (!room || !player) {
      setError('Сначала подключись к комнате.')
      return
    }

    if (!isRoomOwner()) {
      setError('Выбирать участников может только владелец комнаты.')
      return
    }

    if (room.status === 'playing') {
      setError('После старта игры нельзя менять участников.')
      return
    }

    try {
      setError('')

      const updatedRoom = await toggleSelectedPlayerRequest(
        room.id,
        player.id,
        targetPlayerID,
      )

      updateRoom(updatedRoom)
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Не удалось изменить выбор игрока.'

      setError(message)
    }
  }

  async function toggleSelectedQuartet(quartetID: string) {
    if (!room || !player) {
      setError('Сначала подключись к комнате.')
      return
    }

    if (!isRoomOwner()) {
      setError('Выбирать квартеты может только владелец комнаты.')
      return
    }

    if (room.status === 'playing') {
      setError('После старта игры нельзя менять квартеты.')
      return
    }

    try {
      setError('')

      const updatedRoom = await toggleSelectedQuartetRequest(
        room.id,
        player.id,
        quartetID,
      )

      updateRoom(updatedRoom)
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Не удалось изменить выбор квартета.'

      setError(message)
    }
  }

  async function loadAvailableQuartets(roomID: string, ownerPlayerID: string) {
    const data = await loadAvailableQuartetsRequest(roomID, ownerPlayerID)

    if (!data) {
      setAvailableQuartets([])
      return
    }

    setAvailableQuartets(data.quartets)
  }

  function requestCard() {
    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
      setError('Нет подключения к серверу.')
      return
    }

    if (!isCurrentPlayerConnected()) {
      setError('Ты не подключён к комнате.')
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

  function createTemporaryMessageID(): string {
    if (crypto.randomUUID) {
      return crypto.randomUUID()
    }

    return `${Date.now()}-${Math.random().toString(16).slice(2)}`
  }

  function showToast(text: string, type: ToastType = 'info') {
    const id = createTemporaryMessageID()

    setToasts((currentToasts) => [
      ...currentToasts,
      {
        id,
        text,
        type,
      },
    ])

    window.setTimeout(() => {
      setToasts((currentToasts) =>
        currentToasts.filter((toast) => toast.id !== id),
      )
    }, 4000)
  }

  function closeToast(toastID: string) {
    setToasts((currentToasts) =>
      currentToasts.filter((toast) => toast.id !== toastID),
    )
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

    if (payload.code === 'game_already_finished') {
      return 'Игра уже завершена.'
    }

    if (payload.code === 'cannot_request_card') {
      return 'Сейчас нельзя запросить карту.'
    }

    if (payload.code === 'cannot_transfer_card') {
      return 'Не удалось передать карту.'
    }

    return payload.message || 'Не удалось запросить карту.'
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
    if (!nextRoom) {
      roomRef.current = null
      setRoom(null)
      return
    }

    const normalizedRoom: Room = {
      ...nextRoom,
      selected_player_ids: nextRoom.selected_player_ids ?? {},
      selected_quartet_ids: nextRoom.selected_quartet_ids ?? {},
    }

    roomRef.current = normalizedRoom
    setRoom(normalizedRoom)
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
      return
    }

    setPublicGameState(data)
    setCurrentTurnPlayerID(data.current_player_id)
    void loadGameEvents(roomID)

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

    const selectedPlayersCount = room.players.filter(
      (roomPlayer) => room.selected_player_ids?.[roomPlayer.id],
    ).length

    return selectedPlayersCount >= 2
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

    if (isNetworkErrorMessage(message)) {
      return 'Не удалось подключиться к серверу.'
    }

    if (message.includes('user already in room')) {
      return 'Этот аккаунт уже находится в комнате.'
    }

    return message
  }

  function getCreateRoomErrorMessage(message: string): string {
    const normalizedMessage = message.trim().toLowerCase()

    if (normalizedMessage === 'player name is required') {
      return 'Введите имя игрока.'
    }

    if (isNetworkErrorMessage(message)) {
      return 'Не удалось подключиться к серверу.'
    }

    return message || 'Не удалось создать комнату.'
  }

  function isNetworkErrorMessage(message: string): boolean {
    const normalizedMessage = message.trim().toLowerCase()

    return (
      normalizedMessage === 'failed to fetch' ||
      normalizedMessage === 'load failed' ||
      normalizedMessage === 'networkerror when attempting to fetch resource.'
    )
  }

  function getStartGameErrorMessage(message: string): string {
    const normalizedMessage = message.trim().toLowerCase()

    if (isNetworkErrorMessage(message)) {
      return 'Не удалось подключиться к серверу.'
    }

    if (normalizedMessage === 'not enough players') {
      return 'Для старта нужно выбрать минимум двух игроков.'
    }

    if (normalizedMessage === 'room already started') {
      return 'Игра уже началась.'
    }

    return message || 'Не удалось начать игру.'
  }

  function saveUser(nextUser: User | null) {
    setUser(nextUser)

    if (nextUser) {
      window.localStorage.setItem('quartetUserID', nextUser.id)
    } else {
      window.localStorage.removeItem('quartetUserID')
    }
  }

  function logoutUser() {
    saveUser(null)
    setUserHistory([])
    showToast('Вы вышли из аккаунта.', 'info')
  }

  async function loadUserHistory(userID: string) {
    const data = await loadUserHistoryRequest(userID)

    setUserHistory(data?.records ?? [])
  }

  async function loadUserQuartets(userID: string) {
    const quartets = await loadUserQuartetsRequest(userID)
    setUserQuartets(quartets)
  }

  async function loginUser() {
    const trimmedCode = recoveryCode.trim()

    if (!trimmedCode) {
      setError('Введите код восстановления.')
      return
    }

    try {
      setError('')

      const data = await loginUserRequest(trimmedCode)

      saveUser(data.user)
      setPlayerName(data.user.player_name)
      setRecoveryCode('')
      showToast('Вы вошли в аккаунт.', 'success')
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Не удалось войти в аккаунт.'

      setError(message)
    }
  }

  async function createUserQuartet() {
    if (!user) {
      setError('Нужен аккаунт.')
      return
    }

    const trimmedTitle = quartetTitle.trim()
    const trimmedCards = quartetCards.map((card) => card.trim())

    if (!trimmedTitle) {
      setError('Введите название квартета.')
      return
    }

    if (hasDuplicateQuartetTitle(trimmedTitle, editingQuartetID)) {
      setError('Квартет с таким названием уже есть.')
      return
    }

    if (trimmedCards.some((card) => !card)) {
      setError('Заполни все 4 карты.')
      return
    }

    if (hasDuplicateCards(trimmedCards)) {
      setError('Карты внутри квартета не должны повторяться.')
      return
    }

    try {
      setError('')

      const createdQuartet = await createUserQuartetRequest(
        user.id,
        trimmedTitle,
        trimmedCards,
      )

      setUserQuartets((current) => [...current, createdQuartet])
      setQuartetTitle('')
      setQuartetCards(['', '', '', ''])

      showToast('Квартет создан.', 'success')
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Не удалось создать квартет.'

      setError(message)
    }
  }

  function hasDuplicateCards(cards: string[]) {
    const normalizedCards = cards.map((card) => card.trim().toLowerCase())
    return new Set(normalizedCards).size !== normalizedCards.length
  }

  async function updatePlayerName() {
    if (!user) {
      return
    }

    const trimmedName = nextPlayerName.trim()

    if (!trimmedName) {
      setError('Введите новое имя.')
      return
    }

    try {
      setError('')

      const updatedUser = await updatePlayerNameRequest(user.id, trimmedName)

      saveUser(updatedUser)
      setPlayerName(updatedUser.player_name)
      setNextPlayerName('')
      showToast('Имя изменено.', 'success')
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Не удалось изменить имя.'

      setError(message)
    }
  }

  async function deleteUserQuartet(quartetID: string) {
    if (!user) {
      return
    }

    try {
      setError('')

      await deleteUserQuartetRequest(user.id, quartetID)

      setUserQuartets((current) =>
        current.filter((quartet) => quartet.ID !== quartetID),
      )

      showToast('Квартет удалён.', 'success')
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Не удалось удалить квартет.'

      setError(message)
    }
  }

  function startEditQuartet(quartet: Quartet) {
    setEditingQuartetID(quartet.ID)
    setQuartetTitle(quartet.Title)
    setQuartetCards(quartet.Cards.map((card) => card.Title))
  }

  async function saveQuartetChanges() {
    if (!user || !editingQuartetID) {
      return
    }

    const trimmedTitle = quartetTitle.trim()
    const trimmedCards = quartetCards.map((card) => card.trim())

    if (!trimmedTitle) {
      setError('Введите название квартета.')
      return
    }

    if (hasDuplicateQuartetTitle(trimmedTitle, editingQuartetID)) {
      setError('Квартет с таким названием уже есть.')
      return
    }

    if (trimmedCards.some((card) => !card)) {
      setError('Заполни все 4 карты.')
      return
    }

    if (hasDuplicateCards(trimmedCards)) {
      setError('Карты внутри квартета не должны повторяться.')
      return
    }

    try {
      setError('')

      await updateUserQuartetRequest(
        user.id,
        editingQuartetID,
        trimmedTitle,
        trimmedCards,
      )

      await loadUserQuartets(user.id)

      setEditingQuartetID(null)
      setQuartetTitle('')
      setQuartetCards(['', '', '', ''])

      showToast('Квартет обновлён.', 'success')
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Не удалось обновить квартет.'

      setError(message)
    }
  }

  function hasDuplicateQuartetTitle(title: string, currentQuartetID?: string | null) {
    const normalizedTitle = title.trim().toLowerCase()

    return userQuartets.some((quartet) => {
      if (currentQuartetID && quartet.ID === currentQuartetID) {
        return false
      }

      return quartet.Title.trim().toLowerCase() === normalizedTitle
    })
  }

  async function loadGameEvents(roomID: string) {
    const data = await loadGameEventsRequest(roomID)

    setGameEvents(data?.events ?? [])
  }

  function formatGameEvent(event: GameEvent): string {
    switch (event.type) {
      case 'game_started':
        return 'Игра началась.'

      case 'card_requested':
        return `${getPlayerName(event.actor_id)} запросил карту у ${getPlayerName(event.target_id)}.`

      case 'card_request_succeeded': {
        const cardTitle = getEventPayloadString(event, 'card_title', 'карта')

        return `Запрос успешен: ${cardTitle} передана игроку ${getPlayerName(event.actor_id)}.`
      }

      case 'card_request_failed': {
        const cardTitle = getEventPayloadString(event, 'card_title', 'запрошенной карты')

        return `У ${getPlayerName(event.target_id)} нет карты ${cardTitle}.`
      }

      case 'quartet_completed': {
        const quartetID = getEventPayloadString(event, 'quartet_id', '')
        const quartetTitle = quartetID ? getQuartetTitle(quartetID) : 'квартет'

        return `${getPlayerName(event.actor_id)} собрал квартет “${quartetTitle}”.`
      }

      case 'turn_changed':
        return `Ход перешёл к ${getPlayerName(event.target_id)}.`

      case 'game_finished': {
        const winnerIDs = event.payload.winner_ids

        if (Array.isArray(winnerIDs) && winnerIDs.length > 0) {
          const winnerNames = winnerIDs
            .filter((winnerID): winnerID is string => typeof winnerID === 'string')
            .map(getPlayerName)
            .join(', ')

          const winnerLabel = winnerIDs.length > 1 ? 'Победители' : 'Победитель'

          return `Игра завершена. ${winnerLabel}: ${winnerNames}.`
        }

        return 'Игра завершена.'
      }

      default:
        return event.type
    }
  }

  function getEventPayloadString(
    event: GameEvent,
    key: string,
    fallback: string,
  ): string {
    const value = event.payload[key]

    return typeof value === 'string' && value ? value : fallback
  }

  function formatEventTime(timestamp: string): string {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
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

      void loadDeck(room.id)
      void loadGameState(room.id)
      void loadPlayerHand(room.id, player.id)
    }

    socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data)

        if (message.type === 'game_started') {
          const payload = message.payload as GameStartedPayload

          updateRoom(payload.room)
          updateDeck(payload.deck)
          showToast('Игра началась.', 'success')

          void loadGameState(payload.room.id)
          void loadGameEvents(payload.room.id)

          if (player) {
            void loadPlayerHand(payload.room.id, player.id)
          }
        }

        if (message.type === 'game_state') {
          const payload = message.payload as PublicGameState

          setPublicGameState(payload)
          setCurrentTurnPlayerID(payload.current_player_id)
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
        }

        if (message.type === 'player_hand') {
          setPlayerHand(message.payload as PlayerHandPayload)
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

            showToast(resultMessage, 'success')
          } else {
            const resultMessage = `Карты “${cardTitle}” нет.`
            const nextPlayerName = getPlayerName(payload.next_player_id)
            const turnMessage =
              player?.id === payload.next_player_id
                ? 'Сейчас твой ход.'
                : `Сейчас ходит ${nextPlayerName}.`

            showToast(resultMessage, 'info')
            showToast(turnMessage, 'info')
          }
        }

        if (message.type === 'request_card_error') {
          const payload = message.payload as RequestCardErrorPayload
          const errorMessage = getRequestCardErrorMessage(payload)

          setError(errorMessage)
          showTemporaryMessage(errorMessage)
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
        }

        if (message.type === 'game_finished') {
          const payload = message.payload as GameFinishedPayload

          setGameFinished(payload)

          const winnerNames = payload.winners.map(getPlayerName).join(', ')
          const winnerLabel = payload.winners.length > 1 ? 'Победители' : 'Победитель'
          const finishedMessage = `Игра завершена. ${winnerLabel}: ${winnerNames}`

          showTemporaryMessage(finishedMessage)
        }

        if (message.type === 'room_updated' || message.type === 'room_state') {
          const payload = message.payload as Room

          updateRoom(payload)
        }

        const persistentGameEventTypes = new Set([
          'game_started',
          'card_request_result',
          'quartet_completed',
          'turn_changed',
          'game_finished',
        ])

        if (persistentGameEventTypes.has(message.type) && roomRef.current) {
          void loadGameEvents(roomRef.current.id)
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Не удалось обработать websocket-сообщение.'

        console.error('Failed to handle websocket message:', err, event.data)
        setError(errorMessage)
      }

    }

    socket.onerror = () => {
      setSocketStatus('error')
      setError('Ошибка websocket-подключения.')
    }

    socket.onclose = () => {
      setSocketStatus('disconnected')

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
      try {
        const savedRoomID = loadRoomID()
        const savedPlayer = loadPlayer()
        const savedUserID = window.localStorage.getItem('quartetUserID')

        if (savedUserID) {
          const loadedUser = await loadUserRequest(savedUserID)
          saveUser(loadedUser)
        }

        if (!savedRoomID) {
          setIsSessionRestored(true)
          return
        }

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
      } catch (err) {
        console.error('Failed to restore session:', err)
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

  useEffect(() => {
    if (!room || room.status === 'playing') {
      return
    }

    void loadAvailableQuartets(room.id, room.owner_player_id)
  }, [room?.id, room?.owner_player_id, room?.status])

  useEffect(() => {
    if (!user) {
      setUserHistory([])
      setUserQuartets([])
      return
    }

    void loadUserHistory(user.id)
    void loadUserQuartets(user.id)
  }, [user?.id])

  const isEntered = room !== null && player !== null && isCurrentPlayerInRoom()
  const isGamePlaying = publicGameState?.status === 'playing'

  return (
    <main className="app">
      <section className="game-page">
        <header className="game-header">
          <h1>Квартет</h1>
          <p>Минимальный клиент для онлайн-игры</p>
        </header>

        {error && <div className="error">{error}</div>}

        <ToastContainer toasts={toasts} onCloseToast={closeToast} />

        {!isSessionRestored && (
          <div className="panel">
            <p>Восстанавливаем session...</p>
          </div>
        )}

        <section
          className={
            !isEntered
              ? 'game-layout entry-layout'
              : isGamePlaying
                ? 'game-layout gameplay-mode'
                : 'game-layout'
          }
        >
          {isSessionRestored && !isEntered && (
            currentView === 'account' ? (
              <AccountPanel
                user={user}
                recoveryCode={recoveryCode}
                onRecoveryCodeChange={setRecoveryCode}
                onCreateUser={createUser}
                onLoginUser={loginUser}
                onLogoutUser={logoutUser}
                onBack={() => setCurrentView('home')}
                accountPlayerName={accountPlayerName}
                onAccountPlayerNameChange={setAccountPlayerName}
                nextPlayerName={nextPlayerName}
                onNextPlayerNameChange={setNextPlayerName}
                onUpdatePlayerName={updatePlayerName}
              />
            ) : currentView === 'quartets' ? (
              <QuartetsPanel
                userQuartets={userQuartets}
                quartetTitle={quartetTitle}
                quartetCards={quartetCards}
                onQuartetTitleChange={setQuartetTitle}
                onQuartetCardsChange={setQuartetCards}
                onCreateUserQuartet={createUserQuartet}
                onDeleteUserQuartet={deleteUserQuartet}
                editingQuartetID={editingQuartetID}
                onStartEditQuartet={startEditQuartet}
                onSaveQuartetChanges={saveQuartetChanges}
                onBack={() => setCurrentView('home')}
              />
            ) : currentView === 'history' ? (
              <HistoryPanel
                records={userHistory}
                onBack={() => setCurrentView('home')}
              />
            ) : (
              <EntryPanel
                playerName={playerName}
                roomIdInput={roomIdInput}
                onPlayerNameChange={setPlayerName}
                onRoomIdInputChange={setRoomIdInput}
                onCreateRoom={createRoom}
                onJoinRoomByID={joinRoomByID}
                isCreatingRoom={isCreatingRoom}
                isJoiningRoom={isJoiningRoom}
                user={user}
                onOpenAccount={() => setCurrentView('account')}
                onOpenQuartets={() => setCurrentView('quartets')}
                onOpenHistory={() => setCurrentView('history')}
              />
            )
          )}

          {isSessionRestored && isEntered && (
            <>
              {room && !isGamePlaying && (
                <div className="layout-main-column">
                  <RoomPanel
                    room={room}
                    currentPlayerID={player?.id ?? null}
                    onLeaveRoom={leaveRoom}
                    onCopyRoomID={copyRoomID}
                    onToggleSelectedPlayer={toggleSelectedPlayer}
                    availableQuartets={availableQuartets}
                    onToggleSelectedQuartet={toggleSelectedQuartet}
                  />
                </div>
              )}

              <div className="gameplay-layout">
                <div className='gameplay-main-zone'>
                  <GameplayTable
                    gameState={publicGameState}
                    currentPlayerID={currentTurnPlayerID}
                    latestEventTexts={[...gameEvents]
                      .slice(-2)
                      .reverse()
                      .map(formatGameEvent)}
                    onPlayerClick={setSelectedTablePlayerID}
                  />

                  {canOpenRequestFlow && (
                    <button
                      className="button request-flow-open-button"
                      type="button"
                      onClick={() => {
                        console.log('open request flow')
                        setIsRequestFlowOpen(true)
                      }}
                    >
                      Открыть новый запрос карты
                    </button>
                  )}

                  <GamePanel
                    room={room}
                    player={player}
                    publicGameState={publicGameState}
                    currentTurnPlayerID={currentTurnPlayerID}
                    temporaryMessages={temporaryMessages}
                    gameFinished={gameFinished}
                    socketStatus={socketStatus}
                    onStartGame={startGame}
                    isRoomOwner={isRoomOwner()}
                    canStartGame={canStartGame()}
                    getPlayerName={getPlayerName}
                    isStartingGame={isStartingGame}
                  />
                </div>

                <div className={`gameplay-hand-zone ${isHandOpen ? 'hand-open' : 'hand-collapsed'}`}>
                  {hasGameStarted && room && isGamePlaying && playerHand && (
                    <>
                      <button
                        className="hand-toggle-button"
                        type="button"
                        onClick={() => setIsHandOpen((current) => !current)}
                      >
                        Моя рука ({playerHand.cards.length} карт)
                        <span>{isHandOpen ? 'Свернуть' : 'Открыть'}</span>
                      </button>

                      {isHandOpen && (
                        <PlayerHandPanel
                          player={player}
                          playerHand={playerHand}
                          getQuartetTitle={getQuartetTitle}
                          onCardPreview={setPreviewCard}
                        />
                      )}
                    </>
                  )}
                </div>
              </div>

              {selectedTablePlayer && publicGameState && (
                <PlayerDetailsModal
                  player={selectedTablePlayer}
                  isCurrentTurn={selectedTablePlayer.id === currentTurnPlayerID}
                  completedQuartetsCount={
                    publicGameState.completed[selectedTablePlayer.id]?.length ?? 0
                  }
                  onClose={() => setSelectedTablePlayerID('')}
                />
              )}

              {isRequestFlowOpen && publicGameState && (
                <RequestCardFlow
                  players={publicGameState.players}
                  currentPlayerID={player?.id ?? ''}
                  selectedTargetPlayerID={targetPlayerID}
                  onSelectTargetPlayer={setTargetPlayerID}
                  onClose={() => setIsRequestFlowOpen(false)}
                  availableRequestCards={availableRequestCards}
                  selectedCardID={selectedCardID}
                  onSelectCard={setSelectedCardID}
                  onPreviewCard={(cardID) => {
                    const card = availableRequestCards.find((item) => item.id === cardID)

                    if (card) {
                      setPreviewCard({
                        id: card.id,
                        title: card.title,
                        quartet_id: card.quartet_id,
                      })
                    }
                  }}
                  onSubmit={() => {
                    requestCard()
                    setIsRequestFlowOpen(false)
                  }}
                  canSubmit={targetPlayerID !== '' && selectedCardID !== ''}
                  playerHand={playerHand}
                  getQuartetTitle={getQuartetTitle}
                />
              )}

              {previewCard && (
                <div className="modal-backdrop" onClick={() => setPreviewCard(null)}>
                  <div
                    className="card-preview-modal"
                    onClick={(event) => event.stopPropagation()}
                  >
                    <div className="card-preview-art">
                      <span>🂠</span>
                    </div>

                    <div className="card-preview-content">
                      <p className="card-preview-kvartet">
                        {getQuartetTitle(previewCard.quartet_id)}
                      </p>

                      <h2>{previewCard.title}</h2>

                      <small>{previewCard.id}</small>
                    </div>

                    <button className="button" type="button" onClick={() => setPreviewCard(null)}>
                      Закрыть
                    </button>
                  </div>
                </div>
              )}

              <div className="layout-side-column">
                {player && (
                  <div className="player-avatar-fixed">
                    <button
                      className="player-avatar-button"
                      type="button"
                      onClick={() => setIsPlayerPanelOpen(true)}
                      aria-label="Открыть игрока"
                    >
                      {player.name.charAt(0).toUpperCase()}
                    </button>
                  </div>
                )}

                {player && isPlayerPanelOpen && (
                  <div
                    className="player-popover-backdrop"
                    onClick={() => setIsPlayerPanelOpen(false)}
                  >
                    <div
                      className="player-popover"
                      onClick={(event) => event.stopPropagation()}
                    >
                      <PlayerPanel player={player} />
                      <button
                        className="button secondary-button"
                        type="button"
                        onClick={() => setIsGameLogOpen((current) => !current)}
                      >
                        {isGameLogOpen ? 'Скрыть журнал' : 'Показать журнал'}
                      </button>

                      {room && (
                        <button
                          className="button secondary-button"
                          type="button"
                          onClick={leaveRoom}
                        >
                          Выйти из комнаты
                        </button>
                      )}
                      <button
                        className="button"
                        type="button"
                        onClick={() => setIsPlayerPanelOpen(false)}
                      >
                        Закрыть
                      </button>
                    </div>
                  </div>
                )}

                {isGameLogOpen && (
                  <div className="panel">
                    <h2>Журнал игры</h2>

                    {gameEvents.length === 0 ? (
                      <p className="form-hint">Событий пока нет.</p>
                    ) : (
                      <div className="game-log-list">
                        {[...gameEvents].reverse().map((event) => (
                          <div className="game-log-item" key={event.id}>
                            <span className="game-log-time">
                              [{formatEventTime(event.created_at)}]
                            </span>

                            <span className="game-log-message">
                              {formatGameEvent(event)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </section>
      </section>
    </main>
  )
}

export default App

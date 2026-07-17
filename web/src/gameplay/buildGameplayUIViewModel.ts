import type {
  GameFinishedPayload,
  PublicGameState,
} from '../types'

import type {
  GameplayActionViewModel,
  GameplayConnectionStatus,
  GameplayConnectionViewModel,
  GameplayPhase,
  GameplayPlayerSeat,
  GameplayPlayerViewModel,
  GameplayResultViewModel,
  GameplayTableViewModel,
  GameplayUIViewModel,
} from './types'

export type BuildGameplayUIViewModelInput = {
  roomID: string
  currentPlayerID: string
  socketStatus: string
  publicGameState: PublicGameState | null
  gameFinished: GameFinishedPayload | null
}

function normalizeConnectionStatus(
  status: string,
): GameplayConnectionStatus {
  switch (status) {
    case 'connected':
    case 'connecting':
    case 'reconnecting':
    case 'disconnected':
    case 'error':
      return status

    default:
      return 'disconnected'
  }
}

function buildConnectionViewModel(
  socketStatus: string,
): GameplayConnectionViewModel {
  const status = normalizeConnectionStatus(socketStatus)

  switch (status) {
    case 'connected':
      return {
        status,
        label: 'Подключено',
        isProblem: false,
      }

    case 'connecting':
      return {
        status,
        label: 'Подключение',
        isProblem: false,
      }

    case 'reconnecting':
      return {
        status,
        label: 'Переподключение',
        isProblem: true,
      }

    case 'error':
      return {
        status,
        label: 'Ошибка подключения',
        isProblem: true,
      }

    case 'disconnected':
      return {
        status,
        label: 'Отключено',
        isProblem: true,
      }
  }
}

function getGameplayPhase(
  publicGameState: PublicGameState | null,
  gameFinished: GameFinishedPayload | null,
): GameplayPhase {
  if (gameFinished || publicGameState?.status === 'finished') {
    return 'finished'
  }

  if (publicGameState?.status === 'playing') {
    return 'playing'
  }

  if (!publicGameState) {
    return 'loading'
  }

  return 'unavailable'
}

const playerSeatsByCount: Record<number, GameplayPlayerSeat[]> = {
  2: ['bottom', 'top'],
  3: ['bottom', 'top-left', 'top-right'],
  4: ['bottom', 'left', 'top', 'right'],
  5: ['bottom', 'bottom-left', 'top-left', 'top-right', 'bottom-right'],
  6: [
    'bottom',
    'bottom-left',
    'left',
    'top',
    'right',
    'bottom-right',
  ],
}

function getPlayerSeat(
  playerCount: number,
  playerIndex: number,
): GameplayPlayerSeat {
  const seats = playerSeatsByCount[playerCount]

  return seats?.[playerIndex] ?? 'top'
}

function buildPlayerViewModels(
  publicGameState: PublicGameState | null,
  currentPlayerID: string,
  gameFinished: GameFinishedPayload | null,
): GameplayPlayerViewModel[] {
  if (!publicGameState) {
    return []
  }

  const playerCount = publicGameState.players.length
  const density = playerCount >= 5 ? 'compact' : 'standard'

  return publicGameState.players.map((player, index) => ({
    id: player.id,
    name: player.name,
    initials: player.name.trim().charAt(0).toUpperCase() || '?',
    cardCount: player.card_count,
    completedQuartetsCount:
      publicGameState.completed[player.id]?.length ?? 0,
    isCurrentUser: player.id === currentPlayerID,
    isCurrentTurn:
      player.id === publicGameState.current_player_id,
    isWinner:
      gameFinished?.winners.includes(player.id) ?? false,
    seat: getPlayerSeat(playerCount, index),
    density,
  }))
}

function buildTableViewModel(
  publicGameState: PublicGameState | null,
  currentPlayerID: string,
  gameFinished: GameFinishedPayload | null,
): GameplayTableViewModel {
  const players = buildPlayerViewModels(
    publicGameState,
    currentPlayerID,
    gameFinished,
  )

  const completedQuartetsCount = publicGameState
    ? Object.values(publicGameState.completed).reduce(
      (total, quartetIDs) => total + quartetIDs.length,
      0,
    )
    : 0

  return {
    playerCount: players.length,
    layoutMode: players.length >= 5 ? 'compact' : 'table',
    players,
    completedQuartetsCount,
  }
}

function buildActionViewModel(
  phase: GameplayPhase,
  publicGameState: PublicGameState | null,
  currentPlayerID: string,
): GameplayActionViewModel {
  if (phase === 'finished') {
    return {
      mode: 'finished',
      title: 'Партия завершена',
      description: 'Игровые действия больше недоступны.',
      canRequestCard: false,
    }
  }

  if (phase !== 'playing' || !publicGameState) {
    return {
      mode: 'disabled',
      title: 'Действие недоступно',
      description: 'Ожидаем загрузку состояния партии.',
      canRequestCard: false,
    }
  }

  const isCurrentPlayerTurn =
    publicGameState.current_player_id === currentPlayerID

  if (isCurrentPlayerTurn) {
    return {
      mode: 'request-card',
      title: 'Сделай запрос карты',
      description:
        'Выбери соперника и карту, которую хочешь получить.',
      canRequestCard: true,
    }
  }

  const turnPlayer = publicGameState.players.find(
    (player) => player.id === publicGameState.current_player_id,
  )

  return {
    mode: 'waiting',
    title: turnPlayer
      ? `Ход игрока ${turnPlayer.name}`
      : 'Ход другого игрока',
    description:
      'Запрос карты станет доступен, когда ход перейдёт к тебе.',
    canRequestCard: false,
  }
}

function buildResultViewModel(
  publicGameState: PublicGameState | null,
  gameFinished: GameFinishedPayload | null,
  currentPlayerID: string,
): GameplayResultViewModel | null {
  if (!gameFinished) {
    return null
  }

  const getPlayerName = (playerID: string) =>
    publicGameState?.players.find(
      (player) => player.id === playerID,
    )?.name ?? playerID

  const scores = gameFinished.scores
    .slice()
    .sort((first, second) => second.score - first.score)
    .map((score) => ({
      playerID: score.player_id,
      playerName: getPlayerName(score.player_id),
      score: score.score,
      isWinner: gameFinished.winners.includes(score.player_id),
      isCurrentUser: score.player_id === currentPlayerID,
    }))

  const currentPlayerResult = scores.find(
    (score) => score.isCurrentUser,
  )

  return {
    winnerNames: gameFinished.winners.map(getPlayerName),
    currentPlayerWon:
      gameFinished.winners.includes(currentPlayerID),
    currentPlayerScore: currentPlayerResult?.score ?? null,
    scores,
  }
}

export function buildGameplayUIViewModel({
  roomID,
  currentPlayerID,
  socketStatus,
  publicGameState,
  gameFinished,
}: BuildGameplayUIViewModelInput): GameplayUIViewModel {
  const phase = getGameplayPhase(
    publicGameState,
    gameFinished,
  )

  const connection =
    buildConnectionViewModel(socketStatus)

  const action = buildActionViewModel(
    phase,
    publicGameState,
    currentPlayerID,
  )

  return {
    phase,

    statusBar: {
      roomID,
      phaseLabel:
        phase === 'finished'
          ? 'Игра завершена'
          : phase === 'playing'
            ? 'Игра идёт'
            : phase === 'loading'
              ? 'Загрузка игры'
              : 'Игра недоступна',
      connection,
    },

    table: buildTableViewModel(
      publicGameState,
      currentPlayerID,
      gameFinished,
    ),

    centralStatus: {
      tone:
        phase === 'finished'
          ? 'finished'
          : action.mode === 'request-card'
            ? 'active'
            : phase === 'unavailable'
              ? 'warning'
              : 'neutral',
      eyebrow:
        phase === 'finished'
          ? 'Результат партии'
          : action.mode === 'request-card'
            ? 'Твой ход'
            : 'Текущий ход',
      title: action.title,
      description: action.description,
      lastAction: null,
    },

    action,

    result: buildResultViewModel(
      publicGameState,
      gameFinished,
      currentPlayerID,
    ),
  }
}

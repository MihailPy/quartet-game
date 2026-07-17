export type GameplayPhase =
  | 'loading'
  | 'playing'
  | 'finished'
  | 'unavailable'

export type GameplayConnectionStatus =
  | 'connected'
  | 'connecting'
  | 'reconnecting'
  | 'disconnected'
  | 'error'

export type GameplayLayoutMode = 'table' | 'compact'

export type GameplayPlayerDensity = 'standard' | 'compact'

export type GameplayPlayerSeat =
  | 'top'
  | 'top-left'
  | 'top-right'
  | 'left'
  | 'right'
  | 'bottom'
  | 'bottom-left'
  | 'bottom-right'

export type GameplayStatusTone =
  | 'neutral'
  | 'active'
  | 'success'
  | 'warning'
  | 'finished'

export type GameplayActionMode =
  | 'request-card'
  | 'waiting'
  | 'finished'
  | 'disabled'

export type GameplayLastActionType =
  | 'game-started'
  | 'turn-changed'
  | 'card-request-succeeded'
  | 'card-request-failed'
  | 'quartet-completed'
  | 'game-finished'

export type GameplayConnectionViewModel = {
  status: GameplayConnectionStatus
  label: string
  isProblem: boolean
}

export type GameplayStatusBarViewModel = {
  roomID: string
  phaseLabel: string
  connection: GameplayConnectionViewModel
}

export type GameplayPlayerViewModel = {
  id: string
  name: string
  initials: string
  cardCount: number
  completedQuartetsCount: number
  isCurrentUser: boolean
  isCurrentTurn: boolean
  isWinner: boolean
  seat: GameplayPlayerSeat
  density: GameplayPlayerDensity
}

export type GameplayTableViewModel = {
  playerCount: number
  layoutMode: GameplayLayoutMode
  players: GameplayPlayerViewModel[]
  completedQuartetsCount: number
}

export type GameplayLastActionViewModel = {
  type: GameplayLastActionType
  text: string
  actorID?: string
  targetID?: string
  cardTitle?: string
  quartetTitle?: string
  createdAt?: string
}

export type GameplayCentralStatusViewModel = {
  tone: GameplayStatusTone
  eyebrow: string
  title: string
  description?: string
  lastAction: GameplayLastActionViewModel | null
}

export type GameplayActionViewModel = {
  mode: GameplayActionMode
  title: string
  description: string
  canRequestCard: boolean
}

export type GameplayResultPlayerViewModel = {
  playerID: string
  playerName: string
  score: number
  isWinner: boolean
  isCurrentUser: boolean
}

export type GameplayResultViewModel = {
  winnerNames: string[]
  currentPlayerWon: boolean
  currentPlayerScore: number | null
  scores: GameplayResultPlayerViewModel[]
}

export type GameplayUIViewModel = {
  phase: GameplayPhase
  statusBar: GameplayStatusBarViewModel
  table: GameplayTableViewModel
  centralStatus: GameplayCentralStatusViewModel
  action: GameplayActionViewModel
  result: GameplayResultViewModel | null
}

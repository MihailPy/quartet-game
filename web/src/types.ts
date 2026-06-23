export type Room = {
  id: string
  status: string
  owner_player_id: string
  selected_player_ids: Record<string, boolean>
  selected_quartet_ids: Record<string, boolean>
  players: Player[]
}

export type Player = {
  id: string
  name: string
  is_ready: boolean
  is_connected: boolean
}

export type Card = {
  ID: string
  QuartetID: string
  Title: string
}

export type Deck = {
  ID: string
  Title: string
  Quartets: Quartet[]
}

export type Quartet = {
  ID: string
  Title: string
  Cards: Card[]
}

export type GameState = {
  ID: string
  Deck: Deck
  Status: string
  CurrentPlayerID: string
  Hands: Record<string, Card[]>
  Completed: Record<string, string[]>
}

export type PublicGameState = {
  game_id: string
  status: string
  current_player_id: string
  players: PublicGamePlayer[]
  completed: Record<string, string[]>
}

export type PublicGamePlayer = {
  id: string
  name: string
  card_count: number
}

export type PlayerHandPayload = {
  player_id: string
  cards: PrivateCard[]
}

export type PrivateCard = {
  id: string
  quartet_id: string
  title: string
}

export type GameFinishedPayload = {
  game_id: string
  winners: string[]
  scores: PlayerScore[]
}

export type PlayerScore = {
  player_id: string
  score: number
}

export type RequestableCard = {
  id: string
  title: string
  quartet_id: string
  quartet_title: string
}

export type StartGameResponse = {
  room: Room
  state: PublicGameState
}

export type RoomDeckResponse = {
  deck: Deck
}

export type GameStartedPayload = {
  room: Room
  deck: Deck
}

export type ServerMessage = {
  type: string
  payload: unknown
}

export type TemporaryMessage = {
  id: string
  text: string
}

export type RequestCardErrorPayload = {
  code: string
  message: string
}

export type ToastType = 'success' | 'error' | 'info'

export type ToastMessage = {
  id: string
  text: string
  type: ToastType
}

export type User = {
  id: string
  player_name: string
  recovery_code: string
  created_at: string
  updated_at: string
}

export type GameHistoryRecord = {
  id: string
  game_id: string
  room_id: string
  user_id: string
  role: string
  score: number
  is_winner: boolean
  created_at: string
}

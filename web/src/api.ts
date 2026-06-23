import type {
  GameHistoryRecord,
  Player,
  PlayerHandPayload,
  PublicGameState,
  Quartet,
  Room,
  RoomDeckResponse,
  StartGameResponse,
  User,
} from './types'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8080'

export type CreateRoomResponse = {
  room: Room
  player: Player
}

export type AvailableQuartetsResponse = {
  quartets: Quartet[]
}

export async function createRoomRequest(
  userID: string,
): Promise<CreateRoomResponse> {
  const response = await fetch(`${API_URL}/rooms`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      user_id: userID,
    }),
  })

  if (!response.ok) {
    const errorPayload = await response.json().catch(() => null)

    throw new Error(errorPayload?.error ?? 'Не удалось создать комнату.')
  }

  return (await response.json()) as CreateRoomResponse
}

export async function loadRoomRequest(roomID: string): Promise<Room> {
  const response = await fetch(`${API_URL}/rooms/${roomID}`)

  if (!response.ok) {
    throw new Error('Failed to load room')
  }

  return (await response.json()) as Room
}

export async function joinRoomRequest(
  roomID: string,
  playerName: string,
  userID?: string,
): Promise<{
  room: Room
  player: Player
}> {
  const response = await fetch(`${API_URL}/rooms/${roomID}/join`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: playerName,
      user_id: userID ?? '',
    }),
  })

  if (!response.ok) {
    const errorPayload = await response.json().catch(() => null)

    throw new Error(
      errorPayload?.error ?? 'Не удалось подключиться к комнате.',
    )
  }

  return (await response.json()) as {
    room: Room
    player: Player
  }
}

export async function markReadyRequest(
  roomID: string,
  playerID: string,
): Promise<Room> {
  const response = await fetch(`${API_URL}/rooms/${roomID}/ready`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      player_id: playerID,
    }),
  })

  if (!response.ok) {
    throw new Error('Failed to mark player ready')
  }

  return (await response.json()) as Room
}

export async function startGameRequest(
  roomID: string,
  playerID: string,
): Promise<StartGameResponse> {
  const response = await fetch(`${API_URL}/rooms/${roomID}/start`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      player_id: playerID,
    }),
  })

  if (!response.ok) {
    const errorPayload = await response.json().catch(() => null)

    throw new Error(
      errorPayload?.error ?? 'Не удалось начать игру.',
    )
  }

  return (await response.json()) as StartGameResponse
}

export async function loadDeckRequest(roomID: string): Promise<RoomDeckResponse | null> {
  const response = await fetch(`${API_URL}/rooms/${roomID}/deck`)

  if (!response.ok) {
    return null
  }

  return (await response.json()) as RoomDeckResponse
}

export async function loadGameStateRequest(
  roomID: string,
): Promise<PublicGameState | null> {
  const response = await fetch(`${API_URL}/rooms/${roomID}/state`)

  if (!response.ok) {
    return null
  }

  return (await response.json()) as PublicGameState
}

export async function loadPlayerHandRequest(
  roomID: string,
  playerID: string,
): Promise<PlayerHandPayload | null> {
  const response = await fetch(
    `${API_URL}/rooms/${roomID}/hand?player_id=${playerID}`,
  )

  if (!response.ok) {
    return null
  }

  return (await response.json()) as PlayerHandPayload
}

export async function toggleSelectedPlayerRequest(
  roomID: string,
  ownerPlayerID: string,
  targetPlayerID: string,
): Promise<Room> {
  const response = await fetch(`${API_URL}/rooms/${roomID}/selected-player`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      owner_player_id: ownerPlayerID,
      target_player_id: targetPlayerID,
    }),
  })

  if (!response.ok) {
    const errorPayload = await response.json().catch(() => null)
    throw new Error(errorPayload?.error ?? 'Не удалось изменить выбор игрока.')
  }

  return (await response.json()) as Room
}

export async function loadAvailableQuartetsRequest(
  roomID: string,
  ownerPlayerID: string,
): Promise<AvailableQuartetsResponse | null> {
  const response = await fetch(
    `${API_URL}/rooms/${roomID}/available-quartets?owner_player_id=${ownerPlayerID}`,
  )

  if (!response.ok) {
    return null
  }

  return (await response.json()) as AvailableQuartetsResponse
}

export async function toggleSelectedQuartetRequest(
  roomID: string,
  ownerPlayerID: string,
  quartetID: string,
): Promise<Room> {
  const response = await fetch(`${API_URL}/rooms/${roomID}/selected-quartet`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      owner_player_id: ownerPlayerID,
      quartet_id: quartetID,
    }),
  })

  if (!response.ok) {
    const errorPayload = await response.json().catch(() => null)
    throw new Error(errorPayload?.error ?? 'Не удалось изменить выбор квартета.')
  }

  return (await response.json()) as Room
}

export type CreateUserResponse = {
  user: User
}

export async function createUserRequest(playerName: string): Promise<CreateUserResponse> {
  const response = await fetch(`${API_URL}/users`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      player_name: playerName,
    }),
  })

  if (!response.ok) {
    const errorPayload = await response.json().catch(() => null)
    throw new Error(errorPayload?.error ?? 'Не удалось создать аккаунт.')
  }

  return (await response.json()) as CreateUserResponse
}

export async function loadUserRequest(userID: string): Promise<User | null> {
  const response = await fetch(`${API_URL}/users/${userID}`)

  if (!response.ok) {
    return null
  }

  return (await response.json()) as User
}

export type UserHistoryResponse = {
  records: GameHistoryRecord[]
}

export async function loadUserHistoryRequest(
  userID: string,
): Promise<UserHistoryResponse | null> {
  const response = await fetch(`${API_URL}/users/${userID}/history`)

  if (!response.ok) {
    return null
  }

  return (await response.json()) as UserHistoryResponse
}

export async function loginUserRequest(
  recoveryCode: string,
): Promise<CreateUserResponse> {
  const response = await fetch(`${API_URL}/users/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      recovery_code: recoveryCode,
    }),
  })

  if (!response.ok) {
    const errorPayload = await response.json().catch(() => null)
    throw new Error(errorPayload?.error ?? 'Не удалось войти в аккаунт.')
  }

  return (await response.json()) as CreateUserResponse
}

export async function createUserQuartetRequest(
  ownerUserID: string,
  title: string,
  cards: string[],
): Promise<Quartet> {
  const response = await fetch(`${API_URL}/quartets`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      owner_user_id: ownerUserID,
      title,
      cards,
    }),
  })

  if (!response.ok) {
    const errorPayload = await response.json().catch(() => null)
    throw new Error(errorPayload?.error ?? 'Не удалось создать квартет.')
  }

  return (await response.json()) as Quartet
}

export async function loadUserQuartetsRequest(
  userID: string,
): Promise<Quartet[]> {
  const response = await fetch(`${API_URL}/quartets?user_id=${userID}`)

  if (!response.ok) {
    return []
  }

  return (await response.json()) as Quartet[]
}

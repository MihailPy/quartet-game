import type {
  Player,
  PlayerHandPayload,
  PublicGameState,
  Room,
  RoomDeckResponse,
  StartGameResponse,
} from './types'

const API_URL = 'http://localhost:8080'

export async function createRoomRequest(): Promise<Room> {
  const response = await fetch(`${API_URL}/rooms`, {
    method: 'POST',
  })

  if (!response.ok) {
    throw new Error('Failed to create room')
  }

  return (await response.json()) as Room
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
    }),
  })

  if (!response.ok) {
    throw new Error('Failed to join room')
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
    throw new Error('Failed to start game')
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

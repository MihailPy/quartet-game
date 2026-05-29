import type { Player } from './types'

const STORAGE_ROOM_ID_KEY = 'quartet_room_id'
const STORAGE_PLAYER_KEY = 'quartet_player'

export function saveRoomID(roomID: string) {
  localStorage.setItem(STORAGE_ROOM_ID_KEY, roomID)
}

export function loadRoomID(): string | null {
  return localStorage.getItem(STORAGE_ROOM_ID_KEY)
}

export function clearRoomID() {
  localStorage.removeItem(STORAGE_ROOM_ID_KEY)
}

export function savePlayer(player: Player) {
  localStorage.setItem(STORAGE_PLAYER_KEY, JSON.stringify(player))
}

export function loadPlayer(): Player | null {
  const savedPlayerJSON = localStorage.getItem(STORAGE_PLAYER_KEY)

  if (!savedPlayerJSON) {
    return null
  }

  try {
    return JSON.parse(savedPlayerJSON) as Player
  } catch {
    localStorage.removeItem(STORAGE_PLAYER_KEY)
    return null
  }
}

export function clearPlayer() {
  localStorage.removeItem(STORAGE_PLAYER_KEY)
}

export function clearSession() {
  clearRoomID()
  clearPlayer()
}

export function buildRoomWebSocketURL(roomID: string, playerID: string): string {
  const params = new URLSearchParams({
    player_id: playerID,
  })

  return `ws://localhost:8080/rooms/${roomID}/ws?${params.toString()}`
}

export type RequestCardMessage = {
  type: 'request_card'
  payload: {
    target_player_id: string
    card_id: string
  }
}

export type ClientMessage = RequestCardMessage

export function buildRequestCardMessage(
  targetPlayerID: string,
  cardID: string,
): ClientMessage {
  return {
    type: 'request_card',
    payload: {
      target_player_id: targetPlayerID,
      card_id: cardID,
    },
  }
}

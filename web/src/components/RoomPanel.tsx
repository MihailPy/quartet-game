import type { Room } from '../types'

type RoomPanelProps = {
  room: Room | null
  currentPlayerID: string | null
  onLeaveRoom: () => void
  onCopyRoomID: () => void
  onToggleSelectedPlayer: (playerID: string) => void
}

export function RoomPanel({
  room,
  currentPlayerID,
  onLeaveRoom,
  onCopyRoomID,
  onToggleSelectedPlayer,
}: RoomPanelProps) {
  const totalPlayersCount = room?.players.length ?? 0
  const selectedPlayersCount =
    room?.players.filter((roomPlayer) => room.selected_player_ids?.[roomPlayer.id]).length ?? 0

  const isCurrentPlayerOwner =
    Boolean(room && currentPlayerID && room.owner_player_id === currentPlayerID)

  return (
    <div className="panel">
      <h2>Комната</h2>

      {!room && <p>Комната не загружена.</p>}

      {room && (
        <div className="room-info">
          <div className="room-id-box">
            <span className="field-label">ID комнаты</span>

            <div className="room-id-row">
              <code className="room-id">{room.id}</code>

              <button
                className="secondary-button room-id-copy-button"
                type="button"
                onClick={onCopyRoomID}
              >
                Копировать
              </button>
            </div>
          </div>

          <button className="button secondary-button" onClick={onLeaveRoom}>
            Выйти из комнаты
          </button>

          <p>
            <strong>Статус:</strong> {room.status}
          </p>

          <h3>Игроки</h3>

          {room.players.length === 0 && <p>Пока игроков нет.</p>}

          {room.players.map((roomPlayer) => {
            const isSelected = room.selected_player_ids?.[roomPlayer.id] === true

            return (
              <div className="player-row" key={roomPlayer.id}>
                <span>
                  {isCurrentPlayerOwner && room.status !== 'playing' && (
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => onToggleSelectedPlayer(roomPlayer.id)}
                      aria-label={`Выбрать игрока ${roomPlayer.name}`}
                    />
                  )}

                  {roomPlayer.name}
                  {roomPlayer.id === currentPlayerID ? ' (ты)' : ''}
                  {roomPlayer.id === room.owner_player_id ? ' 👑' : ''}
                </span>

                <div className="player-badges">
                  <span className={roomPlayer.is_connected ? 'connected-badge' : 'disconnected-badge'}>
                    {roomPlayer.is_connected ? 'онлайн' : 'офлайн'}
                  </span>

                  <span className={isSelected ? 'ready-badge' : 'not-ready-badge'}>
                    {isSelected ? 'выбран' : 'не выбран'}
                  </span>
                </div>
              </div>
            )
          })}

          {room.status !== 'playing' && (
            <div className="waiting-box">
              <strong>Ожидание старта</strong>

              <p>
                Выбраны {selectedPlayersCount} из {totalPlayersCount} игроков.
              </p>

              {isCurrentPlayerOwner && (
                <p className="form-hint">
                  Владелец комнаты выбирает участников партии.
                </p>
              )}

              {!isCurrentPlayerOwner && (
                <p className="form-hint">
                  Владелец комнаты выбирает, кто будет участвовать в партии.
                </p>
              )}

              {selectedPlayersCount < 2 && (
                <p className="form-hint">
                  Для игры нужно выбрать минимум двух игроков.
                </p>
              )}

              {selectedPlayersCount >= 2 && (
                <p className="form-hint">
                  Владелец комнаты может начать игру.
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

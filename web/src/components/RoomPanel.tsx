import type { Room } from '../types'

type RoomPanelProps = {
  room: Room | null
  currentPlayerID: string | null
  onLeaveRoom: () => void
}

export function RoomPanel({
  room,
  currentPlayerID,
  onLeaveRoom,
}: RoomPanelProps) {
  const readyPlayersCount =
    room?.players.filter((roomPlayer) => roomPlayer.is_ready).length ?? 0

  const totalPlayersCount = room?.players.length ?? 0

  const allPlayersReady =
    totalPlayersCount > 0 && readyPlayersCount === totalPlayersCount

  const currentPlayer = room?.players.find(
    (roomPlayer) => roomPlayer.id === currentPlayerID,
  )

  const notReadyPlayers =
    room?.players.filter((roomPlayer) => !roomPlayer.is_ready) ?? []

  return (
    <div className="panel">
      <h2>Комната</h2>

      {!room && <p>Комната не загружена.</p>}

      {room && (
        <div className="room-info">
          <div className="room-id-box">
            <span className="field-label">ID комнаты</span>
            <code className="room-id">{room.id}</code>
          </div>

          <button className="button secondary-button" onClick={onLeaveRoom}>
            Выйти из комнаты
          </button>

          <p>
            <strong>Статус:</strong> {room.status}
          </p>

          <h3>Игроки</h3>

          {room.players.length === 0 && <p>Пока игроков нет.</p>}

          {room.players.map((roomPlayer) => (
            <div className="player-row" key={roomPlayer.id}>
              <span>
                {roomPlayer.name}
                {roomPlayer.id === currentPlayerID ? ' (ты)' : ''}
                {roomPlayer.id === room.owner_player_id ? ' 👑' : ''}
              </span>
              <div className="player-badges">
                <span className={roomPlayer.is_connected ? 'connected-badge' : 'disconnected-badge'}>
                  {roomPlayer.is_connected ? 'онлайн' : 'офлайн'}
                </span>

                <span className={roomPlayer.is_ready ? 'ready-badge' : 'not-ready-badge'}>
                  {roomPlayer.is_ready ? 'готов' : 'не готов'}
                </span>
              </div>
            </div>
          ))}

          {room.status !== 'playing' && (
            <div className="waiting-box">
              <strong>Ожидание старта</strong>

              <p>
                Готовы {readyPlayersCount} из {totalPlayersCount} игроков.
              </p>

              {currentPlayer && !currentPlayer.is_ready && (
                <p className="current-player-warning">
                  Ты ещё не готов. Нажми “Готовиться”.
                </p>
              )}

              {currentPlayer?.is_ready && !allPlayersReady && (
                <p className="form-hint">
                  Ты готов. Осталось дождаться остальных игроков.
                </p>
              )}

              {notReadyPlayers.length > 0 && (
                <div className="not-ready-list">
                  <strong>Ещё не готовы:</strong>

                  <ul>
                    {notReadyPlayers.map((roomPlayer) => (
                      <li key={roomPlayer.id}>{roomPlayer.name}</li>
                    ))}
                  </ul>
                </div>
              )}

              {totalPlayersCount < 2 && (
                <p className="form-hint">
                  Для игры нужно минимум два игрока.
                </p>
              )}

              {totalPlayersCount >= 2 && !allPlayersReady && (
                <p className="form-hint">
                  Все игроки должны нажать “Готовиться”.
                </p>
              )}

              {totalPlayersCount >= 2 && allPlayersReady && (
                <p className="form-hint">
                  Все готовы. Владелец комнаты может начать игру.
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

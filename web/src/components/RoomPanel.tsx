import type { Quartet, Room } from '../types'

type RoomPanelProps = {
  room: Room | null
  currentPlayerID: string | null
  onLeaveRoom: () => void
  onCopyRoomID: () => void
  onToggleSelectedPlayer: (playerID: string) => void
  availableQuartets: Quartet[]
  onToggleSelectedQuartet: (quartetID: string) => void
}

export function RoomPanel({
  room,
  currentPlayerID,
  onLeaveRoom,
  onCopyRoomID,
  onToggleSelectedPlayer,
  availableQuartets,
  onToggleSelectedQuartet,
}: RoomPanelProps) {
  const totalPlayersCount = room?.players.length ?? 0
  const selectedPlayersCount =
    room?.players.filter((roomPlayer) => room.selected_player_ids?.[roomPlayer.id]).length ?? 0
  const selectedQuartetsCount =
    Object.values(room?.selected_quartet_ids ?? {}).filter(Boolean).length
  const hasEnoughPlayers = selectedPlayersCount >= 2
  const hasSelectedQuartets = selectedQuartetsCount > 0
  const isRoomReadyToStart = hasEnoughPlayers && hasSelectedQuartets
  const totalQuartetsCount = availableQuartets.length

  const isCurrentPlayerOwner =
    Boolean(room && currentPlayerID && room.owner_player_id === currentPlayerID)

  return (
    <div className="panel">
      <div className="room-waiting-header">
        <div>
          <h2>Комната ожидания</h2>
          <p className="form-hint">
            Выбери игроков и квартеты, затем начни игру.
          </p>
        </div>
      </div>

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

          <div className="room-waiting-summary">
            <span>Игроков: {totalPlayersCount}</span>
            <span>Выбрано игроков: {selectedPlayersCount}</span>
            <span>Выбрано квартетов: {selectedQuartetsCount}</span>
          </div>

          <button className="button secondary-button" onClick={onLeaveRoom}>
            Выйти из комнаты
          </button>

          <p>
            <strong>Статус:</strong> {room.status}
          </p>

          <div className="room-section-header">
            <div>
              <h3>Игроки</h3>
              <p className="form-hint">
                Выбранные игроки будут участвовать в партии.
              </p>
            </div>
          </div>

          {room.players.length === 0 && <p>Пока игроков нет.</p>}

          <div className='player-select-list'>
            {room.players.map((roomPlayer) => {
              const isSelected = room.selected_player_ids?.[roomPlayer.id] === true

              return (
                <label
                  className={
                    isSelected
                      ? 'player-select-row player-select-row-selected'
                      : 'player-select-row'
                  }
                  key={roomPlayer.id}
                >
                  <span className="player-select-main">
                    {isCurrentPlayerOwner && room.status !== 'playing' && (
                      <input
                        className="player-select-checkbox"
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => onToggleSelectedPlayer(roomPlayer.id)}
                        aria-label={`Выбрать игрока ${roomPlayer.name}`}
                      />
                    )}

                    <span className="player-select-title">
                      <strong>{roomPlayer.name}</strong>

                      <span className="player-inline-labels">
                        {roomPlayer.id === currentPlayerID && (
                          <span className="player-inline-label">ты</span>
                        )}

                        {roomPlayer.id === room.owner_player_id && (
                          <span className="player-inline-label">владелец</span>
                        )}
                      </span>
                    </span>
                  </span>

                  <span className="player-select-badges">
                    <span className={roomPlayer.is_connected ? 'connected-badge' : 'disconnected-badge'}>
                      {roomPlayer.is_connected ? 'онлайн' : 'офлайн'}
                    </span>

                    <span className={isSelected ? 'ready-badge' : 'not-ready-badge'}>
                      {isSelected ? 'выбран' : 'не выбран'}
                    </span>
                  </span>
                </label>
              )
            })}
          </div>

          {room.status !== 'playing' && (
            <div className={isRoomReadyToStart ? 'waiting-box waiting-box-ready' : 'waiting-box'}>
              <strong>
                {isRoomReadyToStart ? 'Комната готова к старту' : 'Ожидание старта'}
              </strong>

              <p>
                Выбраны {selectedPlayersCount} из {totalPlayersCount} игроков.
              </p>

              {!hasEnoughPlayers && (
                <p className="form-hint">
                  Нужно выбрать минимум двух игроков.
                </p>
              )}

              {!hasSelectedQuartets && (
                <p className="form-hint">
                  Нужно выбрать минимум один квартет.
                </p>
              )}

              {isRoomReadyToStart && isCurrentPlayerOwner && (
                <p className="form-hint">
                  Можно начинать игру.
                </p>
              )}

              {isRoomReadyToStart && !isCurrentPlayerOwner && (
                <p className="form-hint">
                  Ожидаем, когда владелец комнаты начнёт игру.
                </p>
              )}
            </div>
          )}

          {room.status !== 'playing' && (
            <div className="quartet-selection-box">
              <div className="room-section-header">
                <div>
                  <h3>Квартеты для игры</h3>
                  <p className="form-hint">
                    Выбранные квартеты попадут в колоду этой партии.
                  </p>
                </div>

                <span className="room-section-counter">
                  {selectedQuartetsCount} / {totalQuartetsCount}
                </span>
              </div>

              {availableQuartets.length === 0 && (
                <div className="room-empty-state">
                  <strong>Квартеты не найдены</strong>
                  <p className="form-hint">
                    Создай свои квартеты в редакторе или проверь подключение к серверу.
                  </p>
                </div>
              )}

              <div className='quartet-select-list'>
                {availableQuartets.map((quartet) => {
                  const isSelected = room.selected_quartet_ids?.[quartet.ID] === true

                  return (
                    <label
                      className={
                        isSelected
                          ? 'quartet-select-row quartet-select-row-selected'
                          : 'quartet-select-row'
                      }
                      key={quartet.ID}
                    >
                      <span className="quartet-select-main">
                        {isCurrentPlayerOwner && (
                          <input
                            className="quartet-select-checkbox"
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => onToggleSelectedQuartet(quartet.ID)}
                            aria-label={`Выбрать квартет ${quartet.Title}`}
                          />
                        )}

                        <span className="quartet-select-title">
                          {quartet.Title}
                        </span>
                      </span>

                      <span className={isSelected ? 'ready-badge' : 'not-ready-badge'}>
                        {isSelected ? 'выбран' : 'не выбран'}
                      </span>
                    </label>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

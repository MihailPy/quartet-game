import type { GameHistoryRecord, User } from '../types'
type EntryPanelProps = {
  playerName: string
  roomIdInput: string
  onPlayerNameChange: (value: string) => void
  onRoomIdInputChange: (value: string) => void
  onCreateRoom: () => void
  onJoinRoomByID: () => void
  isCreatingRoom: boolean
  isJoiningRoom: boolean
  user: User | null
  onCreateUser: () => void
  userHistory: GameHistoryRecord[]
  onLogoutUser: () => void
}

export function EntryPanel({
  playerName,
  roomIdInput,
  onPlayerNameChange,
  onRoomIdInputChange,
  onCreateRoom,
  onJoinRoomByID,
  isCreatingRoom,
  isJoiningRoom,
  user,
  onCreateUser,
  userHistory,
  onLogoutUser,
}: EntryPanelProps) {
  const playerNameIsEmpty = playerName.trim() === ''
  const roomIdIsEmpty = roomIdInput.trim() === ''

  return (
    <div className="panel entry-panel">
      <div className="form-block">
        <h3>Аккаунт</h3>

        {user ? (
          <>
            <p className="form-hint">
              Аккаунт: {user.player_name}
            </p>

            <button className="button secondary-button" type="button" onClick={onLogoutUser}>
              Выйти из аккаунта
            </button>
          </>
        ) : (
          <>
            <p className="form-hint">
              Для создания комнаты нужен аккаунт. Для входа в чужую комнату можно играть как гость.
            </p>

            <button className="button secondary-button" type="button" onClick={onCreateUser}>
              Создать аккаунт
            </button>
          </>
        )}
      </div>

      {user && (
        <div className="form-block">
          <h3>История игр</h3>

          {userHistory.length === 0 && (
            <p className="form-hint">История пока пустая.</p>
          )}

          {userHistory.map((record) => (
            <div className="player-row" key={record.id}>
              <span>
                Комната {record.room_id}
                {record.is_winner ? ' 👑' : ''}
              </span>

              <span>{record.score} очков</span>
            </div>
          ))}
        </div>
      )}

      <h2>Войти в игру</h2>

      <label className="form-field">
        <span>Имя игрока</span>
        <input
          className="input"
          placeholder="Например, Mihail"
          value={playerName}
          onChange={(event) => onPlayerNameChange(event.target.value)}
        />
      </label>

      <div className="entry-actions">
        <button
          className="button"
          onClick={onCreateRoom}
          disabled={playerNameIsEmpty || isCreatingRoom}
        >
          {isCreatingRoom ? 'Создаём комнату...' : 'Создать комнату'}
        </button>
      </div>

      <div className="join-existing-room">
        <label className="form-field">
          <span>ID комнаты</span>
          <input
            className="input"
            placeholder="Вставь ID комнаты"
            value={roomIdInput}
            onChange={(event) => onRoomIdInputChange(event.target.value)}
          />
        </label>

        <button
          className="button"
          onClick={onJoinRoomByID}
          disabled={playerNameIsEmpty || roomIdIsEmpty || isJoiningRoom}
        >
          {isJoiningRoom ? 'Входим в комнату...' : 'Войти в комнату'}
        </button>
      </div>
    </div>
  )
}

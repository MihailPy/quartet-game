import type { User } from '../types'

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
  onOpenAccount: () => void
  onOpenQuartets: () => void
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
  onOpenAccount,
  onOpenQuartets,
}: EntryPanelProps) {
  const playerNameIsEmpty = playerName.trim() === ''
  const roomIdIsEmpty = roomIdInput.trim() === ''

  return (
    <div className="panel entry-panel">
      <div className="form-block">
        {user ? (
          <>
            <p className="form-hint">Аккаунт: {user.player_name}</p>

            <div className="entry-actions">
              <button className="button secondary-button" type="button" onClick={onOpenAccount}>
                Аккаунт
              </button>

              <button className="button secondary-button" type="button" onClick={onOpenQuartets}>
                Мои квартеты
              </button>
            </div>
          </>
        ) : (
          <button className="button secondary-button" type="button" onClick={onOpenAccount}>
            Войти в аккаунт
          </button>
        )}
      </div>

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
        {user && (
          <div className="entry-actions">
            <button
              className="button"
              onClick={onCreateRoom}
              disabled={isCreatingRoom}
            >
              {isCreatingRoom ? 'Создаём комнату...' : 'Создать комнату'}
            </button>
          </div>
        )}
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

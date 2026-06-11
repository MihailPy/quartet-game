type EntryPanelProps = {
  playerName: string
  roomIdInput: string
  onPlayerNameChange: (value: string) => void
  onRoomIdInputChange: (value: string) => void
  onCreateRoom: () => void
  onJoinRoomByID: () => void
}

export function EntryPanel({
  playerName,
  roomIdInput,
  onPlayerNameChange,
  onRoomIdInputChange,
  onCreateRoom,
  onJoinRoomByID,
}: EntryPanelProps) {
  const playerNameIsEmpty = playerName.trim() === ''
  const roomIdIsEmpty = roomIdInput.trim() === ''

  return (
    <div className="panel entry-panel">
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
          disabled={playerNameIsEmpty}
        >
          Создать комнату
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
          disabled={playerNameIsEmpty || roomIdIsEmpty}
        >
          Войти в комнату
        </button>
      </div>
    </div>
  )
}

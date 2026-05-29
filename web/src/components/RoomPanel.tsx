import type { Room } from '../types'

type RoomPanelProps = {
  room: Room | null
  roomIdInput: string
  onRoomIdInputChange: (value: string) => void
  onCreateRoom: () => void
  onLoadRoom: () => void
}

export function RoomPanel({
  room,
  roomIdInput,
  onRoomIdInputChange,
  onCreateRoom,
  onLoadRoom,
}: RoomPanelProps) {
  return (
    <div className="panel">
      <h2>Комната</h2>

      <button className="button" onClick={onCreateRoom}>
        Создать комнату
      </button>

      <div className="join-existing-room">
        <input
          className="input"
          placeholder="ID комнаты"
          value={roomIdInput}
          onChange={(event) => onRoomIdInputChange(event.target.value)}
        />

        <button className="button" onClick={onLoadRoom}>
          Подключиться к комнате
        </button>
      </div>

      {room && (
        <div className="room-info">
          <p>
            <strong>ID:</strong> <code>{room.id}</code>
          </p>

          <p>
            <strong>Статус:</strong> {room.status}
          </p>

          <h3>Игроки</h3>

          {room.players.length === 0 && <p>Пока игроков нет.</p>}

          {room.players.map((roomPlayer) => (
            <div className="player-row" key={roomPlayer.id}>
              <span>{roomPlayer.name}</span>
              <span>{roomPlayer.is_ready ? 'готов' : 'не готов'}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

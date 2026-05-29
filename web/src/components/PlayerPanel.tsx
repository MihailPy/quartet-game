import type { Player, Room } from '../types'

type PlayerPanelProps = {
  room: Room | null
  player: Player | null
  playerName: string
  onPlayerNameChange: (value: string) => void
  onJoinRoom: () => void
  onMarkReady: () => void
}

export function PlayerPanel({
  room,
  player,
  playerName,
  onPlayerNameChange,
  onJoinRoom,
  onMarkReady,
}: PlayerPanelProps) {
  return (
    <div className="panel">
      <h2>Мой игрок</h2>

      {!room && <p>Сначала создай или загрузи комнату.</p>}

      {room && !player && (
        <>
          <input
            className="input"
            placeholder="Имя игрока"
            value={playerName}
            onChange={(event) => onPlayerNameChange(event.target.value)}
          />

          <button className="button" onClick={onJoinRoom}>
            Подключиться
          </button>
        </>
      )}

      {player && (
        <div className="player-info">
          <p>
            <strong>Имя:</strong> {player.name}
          </p>

          <p>
            <strong>ID:</strong> <code>{player.id}</code>
          </p>

          <p>
            <strong>Готов:</strong> {player.is_ready ? 'да' : 'нет'}
          </p>

          <button
            className="button"
            onClick={onMarkReady}
            disabled={player.is_ready || room?.status === 'playing'}
          >
            {player.is_ready ? 'Готов' : 'Готовиться'}
          </button>
        </div>
      )}
    </div>
  )
}

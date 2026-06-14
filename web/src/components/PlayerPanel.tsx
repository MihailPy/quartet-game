import type { Player } from '../types'

type PlayerPanelProps = {
  player: Player | null
  onMarkReady: () => void
  isMarkingReady: boolean
}

export function PlayerPanel({
  player,
  onMarkReady,
  isMarkingReady,
}: PlayerPanelProps) {
  return (
    <div className="panel">
      <h2>Мой игрок</h2>

      {!player && <p>Игрок не загружен.</p>}

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
            disabled={player.is_ready || isMarkingReady}
          >
            {isMarkingReady ? 'Отмечаем готовность...' : player.is_ready ? 'Готов' : 'Готовиться'}
          </button>
        </div>
      )}
    </div>
  )
}

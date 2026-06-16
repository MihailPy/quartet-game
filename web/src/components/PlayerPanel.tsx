import type { Player } from '../types'

type PlayerPanelProps = {
  player: Player | null
}

export function PlayerPanel({ player }: PlayerPanelProps) {
  return (
    <div className="panel">
      <h2>Игрок</h2>

      {!player && <p>Игрок не выбран.</p>}

      {player && (
        <div className="player-info">
          <p>
            <strong>Имя:</strong> {player.name}
          </p>

          <p>
            <strong>ID:</strong> {player.id}
          </p>
        </div>
      )}
    </div>
  )
}

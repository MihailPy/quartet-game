import type { PublicGamePlayer } from '../types'

type RequestCardFlowProps = {
  players: PublicGamePlayer[]
  currentPlayerID: string
  selectedTargetPlayerID: string
  onSelectTargetPlayer: (playerID: string) => void
  onClose: () => void
}

export function RequestCardFlow({
  players,
  currentPlayerID,
  selectedTargetPlayerID,
  onSelectTargetPlayer,
  onClose,
}: RequestCardFlowProps) {
  const targetPlayers = players.filter(
    (player) => player.id !== currentPlayerID && player.card_count > 0,
  )

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <section
        className="request-flow-modal"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="request-flow-header">
          <div>
            <h2>Запрос карты</h2>
            <p className="form-hint">Выбери игрока, у которого хочешь спросить карту.</p>
          </div>

          <button className="secondary-button" type="button" onClick={onClose}>
            Закрыть
          </button>
        </header>

        <div className="request-flow-grid">
          {targetPlayers.map((player) => (
            <button
              className={
                player.id === selectedTargetPlayerID
                  ? 'request-flow-player request-flow-player-selected'
                  : 'request-flow-player'
              }
              key={player.id}
              type="button"
              onClick={() => onSelectTargetPlayer(player.id)}
            >
              <div className="player-seat-avatar">
                {player.name.charAt(0).toUpperCase()}
              </div>

              <strong>{player.name}</strong>
              <span>{player.card_count} карт</span>
            </button>
          ))}
        </div>
      </section>
    </div>
  )
}

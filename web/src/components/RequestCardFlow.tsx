import type { PublicGamePlayer, RequestableCard } from '../types'

type RequestCardFlowProps = {
  players: PublicGamePlayer[]
  currentPlayerID: string
  selectedTargetPlayerID: string
  onSelectTargetPlayer: (playerID: string) => void
  onClose: () => void
  availableRequestCards: RequestableCard[]
  selectedCardID: string
  onSelectCard: (cardID: string) => void
}

export function RequestCardFlow({
  players,
  currentPlayerID,
  selectedTargetPlayerID,
  onSelectTargetPlayer,
  onClose,
  availableRequestCards,
  selectedCardID,
  onSelectCard,
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

          {availableRequestCards.length > 0 && (
            <section>
              <h3>Выбери карту</h3>

              <div className="request-flow-cards-grid">
                {availableRequestCards.map((card) => (
                  <button
                    key={card.id}
                    type="button"
                    className={
                      card.id === selectedCardID
                        ? 'request-flow-card request-flow-card-selected'
                        : 'request-flow-card'
                    }
                    onClick={() => onSelectCard(card.id)}
                  >
                    <strong>{card.title}</strong>
                    <small>{card.quartet_title}</small>
                  </button>
                ))}
              </div>
            </section>
          )}
        </div>
      </section>
    </div>
  )
}

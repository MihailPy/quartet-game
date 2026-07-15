import type { PublicGamePlayer, RequestableCard, PlayerHandPayload } from '../types'
import { CardImage } from './CardImage'

type RequestCardFlowProps = {
  players: PublicGamePlayer[]
  currentPlayerID: string
  selectedTargetPlayerID: string
  onSelectTargetPlayer: (playerID: string) => void
  onClose: () => void
  availableRequestCards: RequestableCard[]
  selectedCardID: string
  onSelectCard: (cardID: string) => void
  onPreviewCard: (cardID: string) => void
  onSubmit: () => void
  canSubmit: boolean
  playerHand: PlayerHandPayload | null
  getQuartetTitle: (quartetID: string) => string
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
  onPreviewCard,
  onSubmit,
  canSubmit,
  playerHand,
  getQuartetTitle,
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
        <header className="request-flow-header request-flow-hero">
          <div>
            <span className="request-flow-kicker">Ход игрока</span>
            <h2>Запрос карты</h2>
            <p className="form-hint">
              Сначала выбери соперника, затем карту, которую хочешь получить.
            </p>
          </div>

          <button className="secondary-button request-flow-close-button" type="button" onClick={onClose}>
            Закрыть
          </button>
        </header>

        <div className="request-flow-content">
          <section className="request-flow-section">
            <h3>
              <span>1</span>
              Выбери соперника
            </h3>

            <div className="request-flow-players-grid">
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

          {availableRequestCards.length > 0 && (
            <section className='request-flow-section'>
              <h3>
                <span>2</span>
                Выбери карту
              </h3>

              <div className="request-flow-cards-grid">
                {availableRequestCards.map((card) => (
                  <div
                    className={
                      card.id === selectedCardID
                        ? 'request-flow-card request-flow-card-selected'
                        : 'request-flow-card'
                    }
                    key={card.id}
                  >
                    <button
                      className="request-flow-card-main"
                      type="button"
                      onClick={() => onSelectCard(card.id)}
                    >
                      <CardImage
                        imageUrl={card.image_url}
                        title={card.title}
                        className="request-flow-card-image"
                      />

                      <strong>{card.title}</strong>
                      <small>{card.quartet_title}</small>
                    </button>

                    <button
                      className="secondary-button"
                      type="button"
                      onClick={() => onPreviewCard(card.id)}
                    >
                      Просмотр
                    </button>
                  </div>
                ))}
              </div>
            </section>
          )}

          <footer className="request-flow-actions request-flow-sticky-footer">
            <button
              className="button request-flow-submit-button"
              type="button"
              disabled={!canSubmit}
              onClick={onSubmit}
            >
              Спросить карту
            </button>

            {playerHand && (
              <details className="request-flow-hand-preview">
                <summary>Моя рука ({playerHand.cards.length} карт)</summary>

                <div className="request-flow-hand-cards">
                  {playerHand.cards.map((card) => (
                    <div className="request-flow-hand-card" key={card.id}>
                      <strong>{card.title}</strong>
                      <small>{getQuartetTitle(card.quartet_id)}</small>
                    </div>
                  ))}
                </div>
              </details>
            )}
          </footer>
        </div>
      </section>
    </div>
  )
}

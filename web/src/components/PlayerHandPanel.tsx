import type { Player, PlayerHandPayload } from '../types'

type PlayerHandPanelProps = {
  player: Player | null
  playerHand: PlayerHandPayload | null
  getQuartetTitle: (quartetID: string) => string
}

export function PlayerHandPanel({
  player,
  playerHand,
  getQuartetTitle,
}: PlayerHandPanelProps) {
  const cardsByQuartet =
    playerHand?.cards.reduce<Record<string, typeof playerHand.cards>>(
      (groups, card) => {
        if (!groups[card.quartet_id]) {
          groups[card.quartet_id] = []
        }

        groups[card.quartet_id].push(card)

        return groups
      },
      {},
    ) ?? {}

  function getQuartetProgress(cardsCount: number): string {
    return `${cardsCount} / 4`
  }

  return (
    <div className="panel">
      <h2>Моя рука</h2>

      {!player && <p>Сначала подключись к комнате.</p>}

      {player && !playerHand && <p>Карты появятся после старта игры.</p>}

      {player && playerHand && (
        <div className="hand-quartets-list">
          {Object.entries(cardsByQuartet).map(([quartetID, cards]) => (
            <div className="hand-quartet-group" key={quartetID}>
              <div className="hand-quartet-header">
                <h3>{getQuartetTitle(quartetID)}</h3>

                <span className="quartet-progress">
                  {getQuartetProgress(cards.length)}
                </span>
              </div>

              {cards.length === 4 && (
                <p className="quartet-complete-hint">
                  Квартет собран
                </p>
              )}

              <div className="cards-list">
                {cards.map((card) => (
                  <div className="card" key={card.id}>
                    <strong>{card.title}</strong>
                    <small>{card.id}</small>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

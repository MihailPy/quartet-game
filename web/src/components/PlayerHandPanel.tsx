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
  return (
    <div className="panel">
      <h2>Моя рука</h2>

      {!player && <p>Сначала подключись к комнате.</p>}

      {player && !playerHand && <p>Карты появятся после старта игры.</p>}

      {player && playerHand && (
        <div className="cards-list">
          {playerHand.cards.map((card) => (
            <div className="card" key={card.id}>
              <strong>{card.title}</strong>
              <span>Квартет: {getQuartetTitle(card.quartet_id)}</span>
              <small>{card.id}</small>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
